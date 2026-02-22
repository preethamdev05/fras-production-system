import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface AttendanceLog {
  id: string;
  studentid: string;
  timestamp: Timestamp;
  confidence: number;
  deviceid: string;
}

export interface Student {
  id: string;
  studentid: string;
  name: string;
  createdat: Timestamp;
  active: boolean;
}

export function useRealtimeAttendance(limitCount: number = 50) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'attendance_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs: AttendanceLog[] = [];
      snapshot.forEach((doc) => {
        newLogs.push({ id: doc.id, ...doc.data() } as AttendanceLog);
      });
      setLogs(newLogs);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Firestore listener error:', err);
      setError(err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [limitCount]);
  
  return { logs, loading, error };
}

export function useRealtimeStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'students'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newStudents: Student[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.active !== false) {
          newStudents.push({ id: doc.id, ...data } as Student);
        }
      });
      setStudents(newStudents);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Firestore listener error:', err);
      setError(err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { students, loading, error };
}

export function useStudentCache() {
  const { students } = useRealtimeStudents();
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.studentid === studentId);
    return student ? student.name : studentId;
  };
  return { getStudentName, students };
}