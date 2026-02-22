import asyncio
import logging
import base64
import numpy as np
from datetime import datetime
from typing import Dict, Optional
from google.cloud import firestore
from google.cloud.firestore_v1 import AsyncClient
from google.cloud.firestore_v1.watch import DocumentChange

logger = logging.getLogger(__name__)

class FirestoreEmbeddingSync:
    def __init__(self, collection_name: str = "students", project_id: Optional[str] = None):
        self.collection_name = collection_name
        self.db = AsyncClient(project=project_id)
        self.embeddings: Dict[str, Dict] = {}
        self.last_sync_time: Optional[datetime] = None
        self.listener_task: Optional[asyncio.Task] = None
        self.stop_event = asyncio.Event()
        logger.info(f"Firestore sync initialized for collection {collection_name}")

    async def start_listener(self):
        if self.listener_task is not None:
            logger.warning("Listener already running")
            return
        await self.initial_load()
        self.listener_task = asyncio.create_task(self.listen_for_changes())
        logger.info("Firestore listener started")

    async def stop_listener(self):
        if self.listener_task:
            self.stop_event.set()
            await self.listener_task
            self.listener_task = None
            logger.info("Firestore listener stopped")

    async def initial_load(self):
        logger.info("Loading initial embeddings from Firestore...")
        collection_ref = self.db.collection(self.collection_name)
        docs = collection_ref.stream()
        count = 0
        async for doc in docs:
            data = doc.to_dict()
            if data.get("active", True):
                self.add_embedding(doc.id, data)
                count += 1
        self.last_sync_time = datetime.utcnow()
        logger.info(f"Loaded {count} embeddings from Firestore")

    async def listen_for_changes(self):
        collection_ref = self.db.collection(self.collection_name)
        doc_watch = collection_ref.on_snapshot(self.on_snapshot)
        await self.stop_event.wait()
        doc_watch.unsubscribe()

    def on_snapshot(self, col_snapshot, changes, read_time):
        for change in changes:
            doc_id = change.document.id
            data = change.document.to_dict()
            if change.type.name in ["ADDED", "MODIFIED"]:
                if data.get("active", True):
                    self.add_embedding(doc_id, data)
                    logger.info(f"Embedding updated for student {doc_id}")
                else:
                    self.remove_embedding(doc_id)
                    logger.info(f"Embedding removed for student {doc_id}")
            elif change.type.name == "REMOVED":
                self.remove_embedding(doc_id)
                logger.info(f"Embedding removed for student {doc_id}")
        self.last_sync_time = datetime.utcnow()

    def add_embedding(self, student_id: str, data: Dict):
        try:
            if "embedding_vector_base64" in data:
                embedding_bytes = base64.b64decode(data["embedding_vector_base64"])
                embedding = np.frombuffer(embedding_bytes, dtype=np.float32)
            elif "embedding_vector_quantized" in data:
                embedding_bytes = base64.b64decode(data["embedding_vector_quantized"])
                embedding_int8 = np.frombuffer(embedding_bytes, dtype=np.int8)
                embedding = (embedding_int8.astype(np.float32) / 127.0)
            else:
                logger.warning(f"No embedding found for student {student_id}")
                return
            embedding = embedding / np.linalg.norm(embedding)
            self.embeddings[student_id] = {
                "embedding": embedding,
                "name": data.get("name", "Unknown"),
                "active": data.get("active", True)
            }
        except Exception as e:
            logger.error(f"Error adding embedding for {student_id}: {e}")

    def remove_embedding(self, student_id: str):
        self.embeddings.pop(student_id, None)

    async def enroll_student(self, student_id: str, name: str, embedding: np.ndarray, device_id: Optional[str] = None) -> bool:
        try:
            embedding_quantized = (embedding * 127).astype(np.int8)
            embedding_base64 = base64.b64encode(embedding_quantized.tobytes()).decode('utf-8')
            doc_ref = self.db.collection(self.collection_name).document(student_id)
            await doc_ref.set({
                "studentid": student_id,
                "name": name,
                "embedding_vector_quantized": embedding_base64,
                "created_at": firestore.SERVER_TIMESTAMP,
                "active": True,
                "enrolled_by": device_id or "unknown",
                "embedding_dimension": len(embedding)
            })
            logger.info(f"Student {student_id} enrolled to Firestore")
            return True
        except Exception as e:
            logger.error(f"Failed to enroll student {student_id}: {e}")
            return False

    async def log_attendance(self, student_id: str, confidence: float, device_id: str, metadata: Optional[dict] = None) -> bool:
        try:
            doc_ref = self.db.collection("attendance_logs").document()
            await doc_ref.set({
                "studentid": student_id,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "confidence": confidence,
                "deviceid": device_id,
                "metadata": metadata or {}
            })
            logger.info(f"Attendance logged for student {student_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to log attendance for {student_id}: {e}")
            return False
