"use client";

import { useRealtimeAttendance, useStudentCache } from "@/lib/firestore-hooks";
import { formatDistanceToNow } from "date-fns";
import { Clock, User, Activity } from "lucide-react";

export default function RealtimeAttendanceTable() {
  const { logs, loading, error } = useRealtimeAttendance(100);
  const { getStudentName } = useStudentCache();

  if (loading) return <div>Loading attendance logs...</div>;
  if (error) return <div>Error Loading Logs: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Live Attendance Records</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Updating in real-time</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log, index) => {
              const timestamp = log.timestamp?.toDate();
              const isNew = index < 3;
              return (
                <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-teal-50/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-gray-900">
                    {log.studentid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{getStudentName(log.studentid)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.confidence > 0.7 ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                      {(log.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No attendance logs yet</p>
          </div>
        )}
      </div>
    </div>
  );
}