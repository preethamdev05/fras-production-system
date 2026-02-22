"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import { markAttendance, MatchResponse } from "@/lib/api-client";

export default function AttendancePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [livenessPassed, setLivenessPassed] = useState(true);

  const handleCapture = async (imageBlob: Blob) => {
    if (!livenessPassed) {
      alert("Please ensure your face is properly detected");
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await markAttendance(imageBlob);
      setResult(response);
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error("Attendance error:", error);
      setResult({ matched: false, confidence: 0, message: "Failed to process attendance" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Mark Attendance</h1>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <CameraCapture onCapture={handleCapture} isProcessing={isProcessing} />
            </div>
            <div className="flex flex-col justify-center">
              {isProcessing && (
                <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl">
                  <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                  <p className="text-gray-700 font-medium">Processing...</p>
                </div>
              )}
              {result && !isProcessing && (
                <div className={`p-6 rounded-xl ${result.matched ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {result.matched ? (
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-600" />
                    )}
                    <h3 className={`text-xl font-bold ${result.matched ? "text-green-800" : "text-red-800"}`}>
                      {result.matched ? "Attendance Marked" : "No Match Found"}
                    </h3>
                  </div>
                  {result.matched && (
                    <div className="space-y-2">
                      <p className="text-gray-700"><span className="font-semibold">Student:</span> {result.studentName}</p>
                      <p className="text-gray-700"><span className="font-semibold">ID:</span> {result.studentId}</p>
                      <p className="text-gray-700"><span className="font-semibold">Confidence:</span> {(result.confidence * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  <p className="text-gray-600 mt-4">{result.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}