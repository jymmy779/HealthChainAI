'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { AccessPermission } from '@/lib/types';

export default function DoctorPatientsPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && profile?.role !== 'doctor') {
      router.push('/dashboard');
    }
  }, [loading, profile, router]);

  useEffect(() => {
    if (profile?.role === 'doctor') {
      fetch('/api/doctor/patients')
        .then(r => r.json())
        .then(data => setPermissions(Array.isArray(data) ? data : []))
        .catch(() => setPermissions([]))
        .finally(() => setLoadingData(false));
    }
  }, [profile]);

  if (loading || loadingData) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang tải danh sách bệnh nhân...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'doctor') return null;

  const filtered = permissions.filter(p => {
    const name = p.patient?.full_name?.toLowerCase() ?? '';
    return name.includes(search.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'expired') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'active') return 'Đang hoạt động';
    if (status === 'expired') return 'Đã hết hạn';
    return 'Đã thu hồi';
  };

  const getAccessLabel = (level: string) => {
    if (level === 'all') return 'Toàn bộ hồ sơ';
    if (level === 'limited') return 'Hồ sơ giới hạn';
    return 'Hồ sơ đơn lẻ';
  };

  const isExpiringSoon = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // < 7 ngày
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bệnh nhân của tôi</h1>
          <p className="text-text-secondary mt-1">
            {permissions.length} bệnh nhân đã ủy quyền truy cập hồ sơ cho bạn
          </p>
        </div>
        <Link
          href="/dashboard/doctor"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Dashboard
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm bệnh nhân theo tên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Patient List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-border text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {search ? 'Không tìm thấy bệnh nhân' : 'Chưa có bệnh nhân nào'}
          </h3>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            {search
              ? `Không có bệnh nhân nào tên chứa "${search}".`
              : 'Bệnh nhân cần chủ động cấp quyền từ trang "Quyền truy cập" của họ.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((perm) => {
            const patient = perm.patient;
            const expiring = isExpiringSoon(perm.expiry_date);

            return (
              <Link
                key={perm.id}
                href={`/dashboard/doctor/patients/${perm.patient_id}`}
                className="bg-white rounded-2xl p-5 shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all block group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-lg">
                      {(patient?.full_name ?? 'B').charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-text-primary text-base group-hover:text-primary transition-colors">
                          {patient?.full_name ?? 'Bệnh nhân'}
                        </h3>
                        <p className="text-sm text-text-secondary mt-0.5">
                          {patient?.email ?? ''}
                          {patient?.date_of_birth && ` · ${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} tuổi`}
                          {patient?.blood_group && ` · Nhóm máu ${patient.blood_group}`}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${getStatusColor(perm.status)}`}>
                        {getStatusLabel(perm.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      {/* Access level */}
                      <span className="inline-flex items-center gap-1 text-text-secondary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {getAccessLabel(perm.access_level)}
                      </span>

                      {/* Expiry */}
                      <span className={`inline-flex items-center gap-1 ${expiring ? 'text-amber-600 font-semibold' : 'text-text-secondary'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {expiring ? '⚠ Sắp hết hạn: ' : 'Hết hạn: '}
                        {new Date(perm.expiry_date).toLocaleDateString('vi-VN')}
                      </span>

                      {/* Access count */}
                      <span className="inline-flex items-center gap-1 text-text-secondary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {perm.total_accesses} lượt xem
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
