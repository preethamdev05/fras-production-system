"use client";

import { useEffect, useState } from "react";
import RealtimeAttendanceTable from "@/components/RealtimeAttendanceTable";
import { Activity, Users, Clock, TrendingUp } from "lucide-react";
import { useRealtimeAttendance, useRealtimeStudents } from "@/lib/firestore-hooks";

export default function RealtimeDashboardPage() {
  const { logs } = useRealtimeAttendance(100);
  const { students } = useRealtimeStudents();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayLogs = logs.filter(log => {
    const logDate = log.timestamp?.toDate();
    return logDate >= today;
  });
  
  const uniqueStudentsToday = new Set(todayLogs.map(log => log.studentid)).size;
  const avgConfidence = todayLogs.length > 0 
    ? todayLogs.reduce((sum, log) => sum + log.confidence, 0) / todayLogs.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Real-Time Attendance Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-teal-500" size={32} />
              <span className="text-sm text-gray-500 font-medium">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{students.length}</p>
            <p className="text-sm text-gray-500 mt-1">Enrolled Students</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-blue-500" size={32} />
              <span className="text-sm text-gray-500 font-medium">Today</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{todayLogs.length}</p>
            <p className="text-sm text-gray-500 mt-1">Attendance Logs</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="text-green-500" size={32} />
              <span className="text-sm text-gray-500 font-medium">Unique</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{uniqueStudentsToday}</p>
            <p className="text-sm text-gray-500 mt-1">Students Present</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-purple-500" size={32} />
              <span className="text-sm text-gray-500 font-medium">Quality</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{(avgConfidence * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-1">Avg Confidence</p>
          </div>
        </div>
        
        <RealtimeAttendanceTable />
      </div>
    </div>
  );
}