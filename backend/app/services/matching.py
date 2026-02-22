import logging
import numpy as np
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class VectorMatcher:
    def __init__(self, embedding_sync):
        self.embedding_sync = embedding_sync

    async def find_match(self, query_embedding: np.ndarray, threshold: float = 0.6) -> Dict:
        if len(self.embedding_sync.embeddings) == 0:
            logger.warning("No embeddings available for matching")
            return {"matched": False, "studentid": None, "confidence": 0.0}

        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        best_match = None
        best_similarity = threshold

        for student_id, data in self.embedding_sync.embeddings.items():
            stored_embedding = data["embedding"]
            similarity = float(np.dot(query_embedding, stored_embedding))
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {
                    "matched": True,
                    "studentid": student_id,
                    "student_name": data["name"],
                    "confidence": similarity
                }

        if best_match:
            logger.info(f"Match found: {best_match['studentid']} with confidence {best_match['confidence']:.3f}")
            return best_match
        else:
            logger.info("No match found above threshold")
            return {"matched": False, "studentid": None, "confidence": 0.0}
