"use client";

import React, { useState } from "react";
import Link from "next/link";
import { doctorPatients } from "@/data/mockDoctors";

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export default function DoctorPatients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPatients = doctorPatients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Đang hiệu lực</span>;
      case "expired":
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Hết hạn</span>;
      default:
        return null;
    }
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case "all":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Toàn bộ hồ sơ</span>;
      case "limited":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Một phần</span>;
      case "single":
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Một hồ sơ</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách bệnh nhân</h1>
          <p className="text-gray-500 mt-1">
            Quản lý bệnh nhân đã cấp quyền truy cập hồ sơ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {doctorPatients.filter((p) => p.status === "active").length} bệnh nhân đang theo dõi
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50">
              <UserGroupIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {doctorPatients.filter((p) => p.status === "active").length}
              </p>
              <p className="text-sm text-gray-500">Đang theo dõi</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50">
              <CalendarIcon />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {doctorPatients.filter((p) => p.remainingDays > 0 && p.remainingDays <= 14).length}
              </p>
              <p className="text-sm text-gray-500">Sắp hết hạn</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {doctorPatients.filter((p) => p.status === "expired").length}
              </p>
              <p className="text-sm text-gray-500">Đã hết hạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "all" ? "Tất cả" : status === "active" ? "Đang hiệu lực" : "Hết hạn"}
            </button>
          ))}
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center">
            <UserGroupIcon />
            <p className="text-gray-500 mt-2">Không tìm thấy bệnh nhân nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => (
              <Link
                key={patient.id}
                href={`/doctor/patients/${patient.id}`}
                className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {patient.name}
                      </h3>
                      {getAccessLevelBadge(patient.accessLevel)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500">
                        {patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} tuổi
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">Nhóm máu: {patient.bloodGroup}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {patient.chronicDiseases.map((disease, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full"
                        >
                          {disease}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {getStatusBadge(patient.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {patient.totalRecords} hồ sơ · Cấp ngày {new Date(patient.grantedDate).toLocaleDateString("vi-VN")}
                    </p>
                    {patient.remainingDays > 0 && (
                      <p className="text-xs font-medium text-amber-600 mt-1">
                        Còn {patient.remainingDays} ngày
                      </p>
                    )}
                  </div>
                  <ChevronRightIcon />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}