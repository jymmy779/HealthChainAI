'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { AccessPermission } from '@/lib/types';

export default function DoctorDashboardPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && profile?.role !== 'doctor') {
      router.push('/dashboard');
    }
  }, [loading, profile, router]);

  useEffect(() => {
    if (profile?.role === 'doctor') {
      fetch('/api/doctor/patients')
        .then(r => r.json())
        .then(data => {
          setPermissions(Array.isArray(data) ? data : []);
        })
        .catch(() => setPermissions([]))
        .finally(() => setLoadingData(false));
    }
  }, [profile]);

  if (loading || loadingData) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'doctor') return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  const activePatients = permissions.filter(p => p.status === 'active');
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, Bác sĩ {profile.full_name.split(' ').pop()}! 👨‍⚕️
          </h1>
          <p className="text-text-secondary mt-1">{today}</p>
        </div>

        {/* Verification Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${
          profile.is_verified
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {profile.is_verified ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tài khoản đã xác minh
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Chờ xác minh
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
          <p className="text-sm font-medium text-text-secondary mb-1">Bệnh nhân đang theo dõi</p>
          <p className="text-3xl font-bold text-primary">{activePatients.length}</p>
          <p className="text-xs text-text-secondary mt-2">đã cấp quyền truy cập</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-sm font-medium text-text-secondary mb-1">Chuyên khoa</p>
          <p className="text-lg font-bold text-emerald-700 leading-tight">{profile.specialty || 'Chưa cập nhật'}</p>
          <p className="text-xs text-text-secondary mt-2">{profile.hospital || ''}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-violet-100">
          <p className="text-sm font-medium text-text-secondary mb-1">Tổng số hồ sơ được truy cập</p>
          <p className="text-3xl font-bold text-violet-700">
            {activePatients.reduce((sum, p) => sum + (p.accessible_records_count || 0), 0)}
          </p>
          <p className="text-xs text-text-secondary mt-2">từ các bệnh nhân đã cấp quyền</p>
        </div>
      </div>

      {/* Doctor Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
        <h2 className="text-lg font-bold text-text-primary mb-4">Thông tin bác sĩ</h2>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">
              {profile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-text-secondary">Họ và tên</p>
              <p className="font-semibold text-text-primary">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Email</p>
              <p className="font-semibold text-text-primary">{profile.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Chuyên khoa</p>
              <p className="font-semibold text-text-primary">{profile.specialty || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Bệnh viện / Cơ sở</p>
              <p className="font-semibold text-text-primary">{profile.hospital || '—'}</p>
            </div>
            {profile.license_number && (
              <div className="sm:col-span-2">
                <p className="text-xs text-text-secondary">Số chứng chỉ hành nghề</p>
                <p className="font-semibold text-text-primary font-mono">{profile.license_number}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/doctor/patients"
          className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all block group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">Bệnh nhân của tôi</h3>
          </div>
          <p className="text-primary-light text-sm">
            Xem danh sách {activePatients.length} bệnh nhân đã ủy quyền truy cập hồ sơ cho bạn.
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all">
            Xem ngay
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          href="/dashboard/profile"
          className="bg-white rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-all block group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-primary">Cập nhật hồ sơ</h3>
          </div>
          <p className="text-text-secondary text-sm">
            Cập nhật thông tin chuyên khoa, bệnh viện và số chứng chỉ hành nghề của bạn.
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            Chỉnh sửa
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Recent Patients List */}
      {activePatients.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Bệnh nhân gần đây</h2>
            <Link href="/dashboard/doctor/patients" className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {activePatients.slice(0, 3).map((perm) => (
              <Link
                key={perm.id}
                href={`/dashboard/doctor/patients/${perm.patient_id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary text-sm">
                    {(perm.patient?.full_name ?? 'B').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">
                    {perm.patient?.full_name ?? 'Bệnh nhân'}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Hết hạn: {new Date(perm.expiry_date).toLocaleDateString('vi-VN')}
                    {' · '}{perm.total_accesses} lượt truy cập
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    {perm.access_level === 'all' ? 'Toàn bộ' : perm.access_level === 'limited' ? 'Giới hạn' : 'Đơn lẻ'}
                  </span>
                  <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activePatients.length === 0 && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-border text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Chưa có bệnh nhân nào</h3>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            Bệnh nhân cần chủ động cấp quyền truy cập hồ sơ cho bạn từ trang "Quyền truy cập" của họ.
          </p>
        </div>
      )}
    </div>
  );
}
