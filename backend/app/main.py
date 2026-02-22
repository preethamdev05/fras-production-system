import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from concurrent.futures import ThreadPoolExecutor
import base64

from app.models.face_recognition import FaceRecognitionModel
from app.services.firestore_sync import FirestoreEmbeddingSync
from app.services.matching import VectorMatcher
from app.schemas.requests import MatchResponse, EnrollRequest, EnrollResponse
from app.utils.image_processing import decode_image, validate_face_quality

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

face_model: Optional[FaceRecognitionModel] = None
embedding_sync: Optional[FirestoreEmbeddingSync] = None
vector_matcher: Optional[VectorMatcher] = None
thread_pool: Optional[ThreadPoolExecutor] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_model, embedding_sync, vector_matcher, thread_pool
    logger.info("Starting FRAS Backend Service...")
    thread_pool = ThreadPoolExecutor(max_workers=4)
    logger.info("Thread pool initialized with 4 workers")
    try:
        face_model = FaceRecognitionModel(model_name="buffalo_l", det_size=(640, 640), device="cpu")
    except Exception as e:
        logger.error(f"Failed to load face recognition model: {e}")
        raise
    try:
        embedding_sync = FirestoreEmbeddingSync(collection_name="students")
        await embedding_sync.start_listener()
    except Exception as e:
        logger.error(f"Failed to initialize Firestore sync: {e}")
        raise
    vector_matcher = VectorMatcher(embedding_sync)
    logger.info("FRAS Backend ready to serve requests")
    yield
    logger.info("Shutting down FRAS Backend...")
    if embedding_sync:
        await embedding_sync.stop_listener()
    if thread_pool:
        thread_pool.shutdown(wait=True)
    logger.info("Cleanup completed")

app = FastAPI(title="FRAS Backend API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": face_model is not None,
        "firestore_connected": embedding_sync is not None,
        "embeddings_count": len(embedding_sync.embeddings) if embedding_sync else 0
    }

@app.post("/match", response_model=MatchResponse)
async def match_face(file: UploadFile = File(...), device_id: Optional[str] = Header(None), authorization: Optional[str] = Header(None)):
    if not face_model or not vector_matcher:
        raise HTTPException(status_code=503, detail="Service not ready")
    try:
        image_bytes = await file.read()
        image = decode_image(image_bytes)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        loop = asyncio.get_event_loop()
        embedding, face_data = await loop.run_in_executor(thread_pool, face_model.extract_embedding, image)
        if embedding is None:
            return MatchResponse(matched=False, studentId=None, confidence=0.0, message="No face detected")
        if face_data and face_data.get("landmark_confidence", 0) < 0.85:
            return MatchResponse(matched=False, studentId=None, confidence=0.0, message="Low quality face or potential spoofing")
        match_result = await vector_matcher.find_match(embedding, threshold=0.6)
        if match_result["matched"]:
            await embedding_sync.log_attendance(student_id=match_result["studentid"], confidence=match_result["confidence"], device_id=device_id or "unknown", metadata=face_data)
            return MatchResponse(matched=True, studentId=match_result["studentid"], studentName=match_result.get("student_name"), confidence=match_result["confidence"], message="Match successful")
        else:
            return MatchResponse(matched=False, studentId=None, confidence=0.0, message="No matching student found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in match endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/enroll", response_model=EnrollResponse)
async def enroll_student(request: EnrollRequest):
    if not face_model or not embedding_sync:
        raise HTTPException(status_code=503, detail="Service not ready")
    try:
        image_bytes = base64.b64decode(request.imagebase64)
        image = decode_image(image_bytes)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        loop = asyncio.get_event_loop()
        embedding, face_data = await loop.run_in_executor(thread_pool, face_model.extract_embedding, image)
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in image")
        if face_data and face_data.get("landmark_confidence", 0) < 0.85:
            raise HTTPException(status_code=400, detail="Face quality too low for enrollment")
        
        duplicate_match = await vector_matcher.find_match(embedding, threshold=0.65)
        if duplicate_match["matched"]:
            return EnrollResponse(success=False, message="Enrollment rejected. Face matches existing student.", duplicatedetected=True, duplicatestudentid=duplicate_match["studentid"], duplicatename=duplicate_match.get("student_name"), similarityscore=duplicate_match["confidence"])

        success = await embedding_sync.enroll_student(student_id=request.studentid, name=request.name, embedding=embedding, device_id=request.deviceid)
        if success:
            return EnrollResponse(success=True, studentid=request.studentid, message=f"Student {request.name} enrolled successfully")
        else:
            raise HTTPException(status_code=500, detail="Failed to write to Firestore")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in enroll endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Enrollment failed")

@app.get("/stats")
async def get_stats():
    if not embedding_sync:
        raise HTTPException(status_code=503, detail="Service not ready")
    return {
        "total_students": len(embedding_sync.embeddings),
        "active_students": len([e for e in embedding_sync.embeddings.values() if e.get("active", True)]),
        "last_sync": embedding_sync.last_sync_time.isoformat() if embedding_sync.last_sync_time else None
    }
