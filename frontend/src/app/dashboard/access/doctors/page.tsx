'use client';

import { useState, useMemo } from 'react';
import { useDoctors } from '@/hooks/useData';
import Link from 'next/link';

export default function DoctorsDirectoryPage() {
  const { data: doctors, loading } = useDoctors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');

  // Extract unique specialties and hospitals for filters
  const specialties = useMemo(() => {
    return Array.from(new Set(doctors.map((doc) => doc.specialty).filter(Boolean))) as string[];
  }, [doctors]);

  const hospitals = useMemo(() => {
    return Array.from(new Set(doctors.map((doc) => doc.hospital).filter(Boolean))) as string[];
  }, [doctors]);

  // Filter list of doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.hospital?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSpecialty = !selectedSpecialty || doc.specialty === selectedSpecialty;
      const matchHospital = !selectedHospital || doc.hospital === selectedHospital;

      return matchSearch && matchSpecialty && matchHospital;
    });
  }, [doctors, searchTerm, selectedSpecialty, selectedHospital]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Back Link */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/dashboard/access"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang cấp quyền
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Danh sách Bác sĩ</h1>
          <p className="text-sm text-text-secondary mt-1">
            Tìm kiếm và xem hồ sơ bác sĩ trước khi cấp quyền truy cập hồ sơ sức khỏe
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, chuyên khoa, bệnh viện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-sm text-text-primary"
          />
        </div>

        {/* Specialty Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-sm text-text-primary"
          >
            <option value="">Tất cả chuyên khoa</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Hospital Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-sm text-text-primary"
          >
            <option value="">Tất cả bệnh viện</option>
            {hospitals.map((hosp) => (
              <option key={hosp} value={hosp}>
                {hosp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl pt-2"></div>
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-border shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-text-secondary">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-lg">Không tìm thấy bác sĩ</h3>
            <p className="text-sm text-text-secondary mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc chuyên khoa, bệnh viện khác.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-6 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="space-y-4">
                {/* Doctor Avatar & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {doc.avatar_url ? (
                      <img
                        src={doc.avatar_url}
                        alt={doc.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-md">
                        {doc.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-text-primary text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {doc.full_name}
                      </h3>
                      <p className="text-sm font-medium text-primary mt-0.5">
                        {doc.specialty || 'Bác sĩ đa khoa'}
                      </p>
                    </div>
                  </div>
                  {doc.is_verified && (
                    <span className="bg-emerald-50 text-emerald-600 p-1 rounded-full" title="Bác sĩ đã xác minh">
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.585a2.625 2.625 0 013.466 0l.508.435.508-.435a2.625 2.625 0 013.466 0l1.91 1.637c.758.65.992 1.678.583 2.578l-.758 1.667.758 1.667c.41.9.175 1.928-.583 2.578l-1.91 1.637a2.625 2.625 0 01-3.466 0l-.508-.435-.508.435a2.625 2.625 0 01-3.466 0l-1.91-1.637a2.625 2.625 0 01-.583-2.578l.758-1.667-.758-1.667a2.625 2.625 0 01.583-2.578l1.91-1.637zM10 5a1 1 0 100 2 1 1 0 000-2zm1.293 4.293a1 1 0 00-1.414-1.414L8 9.586 7.121 8.707a1 1 0 00-1.414 1.414l1.5 1.5a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 border-t border-gray-50 pt-3 text-sm">
                  <div className="flex gap-2 text-text-secondary">
                    <svg className="w-4 h-4 shrink-0 text-text-secondary/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="line-clamp-1">{doc.hospital || 'Chưa cập nhật bệnh viện'}</span>
                  </div>
                  {doc.license_number && (
                    <div className="flex gap-2 text-text-secondary">
                      <svg className="w-4 h-4 shrink-0 text-text-secondary/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-mono text-xs">CCHN: {doc.license_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-text-secondary">Đã tham gia {new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                <Link
                  href={`/dashboard/access/doctors/${doc.id}`}
                  className="px-4 py-2 bg-primary-light/40 hover:bg-primary hover:text-white text-primary rounded-xl font-semibold text-xs transition-all flex items-center gap-1"
                >
                  Xem chi tiết & Chọn
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
