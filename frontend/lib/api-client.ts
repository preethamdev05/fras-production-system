const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface MatchResponse {
  matched: boolean;
  studentId?: string;
  studentName?: string;
  confidence: number;
  message: string;
}

export async function markAttendance(imageBlob: Blob): Promise<MatchResponse> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'capture.jpg');
  
  const response = await fetch(`${API_BASE_URL}/match`, {
    method: 'POST',
    body: formData,
    headers: {
      'device-id': getDeviceId()
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark attendance');
  }
  
  return response.json();
}

export async function enrollStudent(studentId: string, name: string, imageBlob: Blob) {
  const base64 = await blobToBase64(imageBlob);
  const response = await fetch(`${API_BASE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      studentid: studentId,
      name: name,
      imagebase64: base64.split(',')[1]
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to enroll student');
  }
  
  return response.json();
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem('deviceid');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceid', deviceId);
  }
  return deviceId;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}