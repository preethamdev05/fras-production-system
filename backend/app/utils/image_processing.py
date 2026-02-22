import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def decode_image(image_bytes: bytes) -> np.ndarray:
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        return None

def validate_face_quality(image: np.ndarray) -> bool:
    if image is None:
        return False
    h, w = image.shape[:2]
    if h < 200 or w < 200:
        logger.warning(f"Image too small: {w}x{h}")
        return False
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    if mean_brightness < 40 or mean_brightness > 220:
        logger.warning(f"Poor brightness: {mean_brightness}")
        return False
    return True
