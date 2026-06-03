"use client";

import React, { useState } from "react";
import { doctorAccessLogs } from "@/data/mockDoctors";

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const DesktopIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default function DoctorAccessLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredLogs = doctorAccessLogs.filter((log) => {
    const matchesSearch = log.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "view":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            <ViewIcon />
            Đã xem
          </span>
        );
      case "download":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            <DownloadIcon />
            Đã tải
          </span>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử truy cập</h1>
          <p className="text-gray-500 mt-1">
            Theo dõi tất cả các hoạt động xem và tải hồ sơ bệnh nhân
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200/50">
          <ListIcon />
          <span className="text-sm text-gray-600">
            Tổng số: <span className="font-semibold text-gray-900">{doctorAccessLogs.length}</span> hoạt động
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50">
              <ViewIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {doctorAccessLogs.filter((l) => l.action === "view").length}
              </p>
              <p className="text-sm text-gray-500">Lượt xem hồ sơ</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50">
              <DownloadIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {doctorAccessLogs.filter((l) => l.action === "download").length}
              </p>
              <p className="text-sm text-gray-500">Lượt tải xuống</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50">
              <DesktopIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(doctorAccessLogs.map((l) => l.patientName)).size}
              </p>
              <p className="text-sm text-gray-500">Bệnh nhân đã truy cập</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Tìm theo tên bệnh nhân hoặc tên hồ sơ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Bệnh nhân</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Hồ sơ</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Hành động</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Thời gian</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Thiết bị</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {log.patientName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{log.patientName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-700">{log.recordName}</span>
                  </td>
                  <td className="p-4">{getActionBadge(log.action)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <ClockIcon />
                      {formatDateTime(log.accessedAt)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <DesktopIcon />
                      {log.deviceInfo}
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                      {log.ipAddress}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <ListIcon />
            <p className="text-gray-500 mt-2">Không tìm thấy hoạt động nào</p>
          </div>
        )}
      </div>
    </div>
  );
}