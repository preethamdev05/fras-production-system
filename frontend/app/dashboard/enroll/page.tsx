"use client";

import { useEffect, useState } from "react";
import EnrollmentForm from "@/components/EnrollmentForm";
import { useRealtimeStudents } from "@/lib/firestore-hooks";
import { Users } from "lucide-react";

export default function EnrollPage() {
  const { students, loading } = useRealtimeStudents();
  const [isAuthorized, setIsAuthorized] = useState(true);

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Enrollment</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8 flex items-center gap-4">
          <Users className="text-teal-500" size={40} />
          <div>
            <p className="text-3xl font-bold text-gray-800">
              {loading ? "..." : students.length}
            </p>
            <p className="text-sm text-gray-500">Total Enrolled Students</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <EnrollmentForm />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={24} className="text-teal-500" />
              Recently Enrolled
            </h2>
            <div className="space-y-2">
              {students.slice(0, 5).map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{student.studentid}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {student.createdat?.toDate().toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}