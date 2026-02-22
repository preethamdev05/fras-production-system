import logging
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis
from typing import Optional, Tuple, Dict

logger = logging.getLogger(__name__)

class FaceRecognitionModel:
    def __init__(self, model_name: str = "buffalo_l", det_size: Tuple[int, int] = (640, 640), device: str = "cpu"):
        self.model_name = model_name
        self.det_size = det_size
        logger.info(f"Loading InsightFace model {model_name}")
        self.app = FaceAnalysis(name=model_name, providers=['CPUExecutionProvider'])
        self.app.prepare(ctx_id=-1, det_size=det_size)
        logger.info(f"Model {model_name} loaded successfully on {device}")

    def extract_embedding(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[Dict]]:
        try:
            faces = self.app.get(image)
            if len(faces) == 0:
                logger.warning("No face detected in image")
                return None, None
            if len(faces) > 1:
                logger.warning(f"Multiple faces detected: {len(faces)}, using largest")
            face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
            embedding = face.normed_embedding
            face_metadata = {
                "bbox": face.bbox.tolist(),
                "landmark_confidence": float(face.det_score),
                "age": int(face.age) if hasattr(face, "age") else None,
                "gender": int(face.gender) if hasattr(face, "gender") else None
            }
            return embedding, face_metadata
        except Exception as e:
            logger.error(f"Error extracting embedding: {e}", exc_info=True)
            return None, None

    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        similarity = np.dot(embedding1, embedding2)
        return float(similarity)
