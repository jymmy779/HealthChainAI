'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const patientNavItems = [
  {
    section: 'Chính',
    items: [
      { label: 'Trang chủ', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', link: '/dashboard' },
      { label: 'Hồ sơ cá nhân', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', link: '/dashboard/profile' },
    ]
  },
  {
    section: 'Hồ sơ sức khỏe',
    items: [
      { label: 'Upload hồ sơ', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', link: '/dashboard/records/upload' },
      { label: 'Danh sách hồ sơ', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', link: '/dashboard/records' },
    ]
  },
  {
    section: 'AI & Phân tích',
    items: [
      { label: 'Phân tích sức khỏe', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', link: '/dashboard/ai' },
      { label: 'Trò chuyện AI', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', link: '/dashboard/ai-chat' },
    ]
  },
  {
    section: 'Quản lý',
    items: [
      { label: 'Quyền truy cập', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', link: '/dashboard/access' },
      { label: 'Lịch sử truy cập', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', link: '/dashboard/access/history' },
      { label: 'Nhắc nhở', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', link: '/dashboard/reminders' },
    ]
  },
  {
    section: 'Khác',
    items: [
      { label: 'Cài đặt', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', link: '/dashboard/settings' },
      { label: 'Hỗ trợ / FAQ', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', link: '/dashboard/faq' },
    ]
  },
];

const doctorNavItems = [
  {
    section: 'Tổng quan',
    items: [
      { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', link: '/dashboard/doctor' },
      { label: 'Hồ sơ bác sĩ', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', link: '/dashboard/profile' },
    ]
  },
  {
    section: 'Bệnh nhân',
    items: [
      { label: 'Bệnh nhân của tôi', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', link: '/dashboard/doctor/patients' },
    ]
  },
  {
    section: 'AI & Tham vấn',
    items: [
      { label: 'Trò chuyện AI', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', link: '/dashboard/doctor/ai-chat' },
    ]
  },
  {
    section: 'Khác',
    items: [
      { label: 'Cài đặt', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', link: '/dashboard/settings' },
    ]
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const navItems = profile?.role === 'doctor' ? doctorNavItems : patientNavItems;

  const closeMobile = () => {
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 lg:top-20 left-0 z-30 h-full lg:h-[calc(100vh-5rem)]
          w-64 bg-white border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-text-primary">HealthChain AI</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Doctor verification badge */}
        {profile?.role === 'doctor' && (
          <div className={`mx-4 mt-4 px-3 py-2 rounded-xl border flex items-center gap-2 ${
            profile.is_verified
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${profile.is_verified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className={`text-xs font-semibold ${profile.is_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
              {profile.is_verified ? '✓ Bác sĩ đã xác minh' : '⏳ Chờ xác minh'}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-6">
          {navItems.map((section) => (
            <div key={section.section}>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-3">
                {section.section}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.link ||
                    (item.link !== '/dashboard' &&
                     item.link !== '/dashboard/doctor' &&
                     pathname.startsWith(item.link + '/') &&
                     !(item.link === '/dashboard/records' && pathname.startsWith('/dashboard/records/upload')) &&
                     !(item.link === '/dashboard/access' && pathname.startsWith('/dashboard/access/history')));

                  const Icon = ({ className }: { className?: string }) => (
                    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  );

                  return (
                    <Link
                      key={item.label}
                      href={item.link}
                      onClick={closeMobile}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${isActive
                          ? 'bg-primary-light/50 text-primary'
                          : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom info */}
        <div className="p-4 border-t border-border">
          <div className={`rounded-xl p-4 ${
            profile?.role === 'doctor'
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
              : 'bg-gradient-to-br from-primary-light/50 to-secondary-light/50'
          }`}>
            <p className="text-sm font-semibold text-text-primary">
              {profile?.role === 'doctor' ? '🩺 Chế độ Bác sĩ' : 'Bảo mật Blockchain'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {profile?.role === 'doctor'
                ? 'Xem hồ sơ bệnh nhân được ủy quyền.'
                : 'Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên Polygon.'
              }
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}