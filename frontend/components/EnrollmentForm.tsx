"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Upload, UserPlus, AlertTriangle, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function EnrollmentForm() {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !name || !imageFile) {
      setResult({ success: false, message: "Please fill in all fields and upload an image" });
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const imageBase64 = await convertToBase64(imageFile);
      const response = await axios.post(`${BACKEND_URL}/enroll`, {
        studentid: studentId,
        name: name,
        imagebase64: imageBase64.split(",")[1],
        deviceid: "admin-portal"
      });
      
      setResult(response.data);
      if (response.data.success) {
        setStudentId("");
        setName("");
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      setResult({
        success: false,
        message: error.response?.data?.detail || error.message || "Enrollment failed"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Enroll New Student</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="e.g., STU001"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="e.g., John Doe"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Face Photo</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {imagePreview ? (
              <div className="space-y-4">
                <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto text-gray-400" size={48} />
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Upload an image
                  </button>
                  <p className="text-gray-500 text-sm mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>
        
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
              ) : (
                <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
              )}
              <div className="flex-1">
                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.duplicatedetected && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">Duplicate Detection</p>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p><span className="font-medium">Matching Student:</span> {result.duplicatename} ({result.duplicatestudentid})</p>
                      <p><span className="font-medium">Similarity:</span> {(result.similarityscore * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <><UserPlus size={20} /><span>Enroll Student</span></>
          )}
        </button>
      </form>
    </div>
  );
}