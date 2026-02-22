from pydantic import BaseModel, Field
from typing import Optional

class MatchResponse(BaseModel):
    matched: bool
    studentId: Optional[str] = None
    studentName: Optional[str] = None
    confidence: float = 0.0
    message: str

class EnrollRequest(BaseModel):
    studentid: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    imagebase64: str = Field(..., description="Base64 encoded image")
    deviceid: Optional[str] = None

class EnrollResponse(BaseModel):
    success: bool
    studentid: Optional[str] = None
    message: str
    duplicatedetected: bool = False
    duplicatestudentid: Optional[str] = None
    duplicatename: Optional[str] = None
    similarityscore: Optional[float] = None
