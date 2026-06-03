"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { currentDoctor, doctorPatients, doctorNotifications } from "@/data/mockDoctors";

// Icons
const PatientsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function DoctorDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const activePatients = doctorPatients.filter((p) => p.status === "active");
  const expiringSoon = doctorPatients.filter((p) => p.remainingDays > 0 && p.remainingDays <= 14);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const day = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}, ${hours}:${minutes}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 14) return "Chào buổi trưa";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case "all":
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Toàn bộ</span>;
      case "limited":
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Một phần</span>;
      case "single":
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Một hồ sơ</span>;
      default:
        return null;
    }
  };

  const filteredPatients = doctorPatients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()},</h1>
          <p className="text-lg text-gray-600">
            <span className="font-semibold text-emerald-600">{currentDoctor.name}</span>
            <span className="mx-2">·</span>
            {formatDate(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200/50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-gray-600">
            Ví: <span className="font-mono font-medium text-gray-900">{currentDoctor.walletAddress}</span>
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Bệnh nhân đang theo dõi",
            value: activePatients.length,
            icon: PatientsIcon,
            color: "bg-emerald-500",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
          },
          {
            label: "Lượt truy cập (tháng này)",
            value: "28",
            icon: ActivityIcon,
            color: "bg-blue-500",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
          },
          {
            label: "Sắp hết hạn",
            value: expiringSoon.length,
            icon: ClockIcon,
            color: "bg-amber-500",
            bgColor: "bg-amber-50",
            textColor: "text-amber-600",
          },
          {
            label: "Xác thực Blockchain",
            value: "Đã kết nối",
            icon: ShieldIcon,
            color: "bg-emerald-500",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <div className={stat.textColor}>
                  <stat.icon />
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Patients + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Bệnh nhân của tôi
                <span className="ml-2 text-sm font-normal text-gray-500">({doctorPatients.length} bệnh nhân)</span>
              </h2>
              <div className="relative">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Tìm bệnh nhân..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48"
                />
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredPatients.map((patient) => (
              <Link
                key={patient.id}
                href={`/doctor/patients/${patient.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {patient.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.chronicDiseases.slice(0, 2).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getAccessLevelBadge(patient.accessLevel)}
                  <span className={`text-xs font-medium ${
                    patient.remainingDays > 14 
                      ? "text-emerald-600" 
                      : patient.remainingDays > 0 
                        ? "text-amber-600" 
                        : "text-red-600"
                  }`}>
                    {patient.remainingDays > 0 
                      ? `Còn ${patient.remainingDays} ngày` 
                      : "Hết hạn"}
                  </span>
                  <ChevronRightIcon />
                </div>
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 text-center">
            <Link
              href="/doctor/patients"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Xem tất cả bệnh nhân
            </Link>
          </div>
        </div>

        {/* Recent Activity & Notifications */}
        <div className="space-y-6">
          {/* Recent Access Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Hoạt động gần đây</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { action: "Xem hồ sơ", patient: "Nguyễn Văn Nam", time: "15:30", icon: ViewIcon },
                { action: "Tải xuống", patient: "Trần Thị Lan", time: "10:15", icon: ViewIcon },
                { action: "Xem hồ sơ", patient: "Phạm Văn Hùng", time: "14:00", icon: ViewIcon },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <activity.icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.patient}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 text-center">
              <Link
                href="/doctor/access-logs"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Xem tất cả hoạt động
              </Link>
            </div>
          </div>

          {/* Pending Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Thông báo mới</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {doctorNotifications.filter((n) => !n.isRead).slice(0, 3).map((notif) => (
                <div key={notif.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                    </div>
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