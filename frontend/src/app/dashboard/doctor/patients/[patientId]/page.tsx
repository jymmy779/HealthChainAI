'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import type { Profile, HealthRecord } from '@/lib/types';

export default function PatientRecordsPage() {
  const { profile: doctorProfile, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Profile | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [openingFile, setOpeningFile] = useState<string | null>(null); // record id đang load



  const handleViewFile = async (recordId: string) => {
    setOpeningFile(recordId);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/records/${recordId}/file`);
      if (!res.ok) throw new Error('Không thể tải file');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch {
      alert('Không thể mở file. Vui lòng thử lại.');
    } finally {
      setOpeningFile(null);
    }
  };

  useEffect(() => {
    if (!loading && doctorProfile?.role !== 'doctor') {
      router.push('/dashboard');
    }
  }, [loading, doctorProfile, router]);

  useEffect(() => {
    if (doctorProfile?.role === 'doctor' && patientId) {
      setLoadingData(true);
      Promise.all([
        fetch(`/api/doctor/patients/${patientId}/profile`).then(r => {
          if (!r.ok) throw new Error('Không có quyền truy cập hồ sơ bệnh nhân này.');
          return r.json();
        }),
        fetch(`/api/doctor/patients/${patientId}/records`).then(r => {
          if (!r.ok) throw new Error('Không thể tải hồ sơ bệnh nhân.');
          return r.json();
        }),
      ])
        .then(([patientData, recordsData]) => {
          setPatient(patientData);
          setRecords(Array.isArray(recordsData) ? recordsData : []);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoadingData(false));
    }
  }, [doctorProfile, patientId]);

  if (loading || loadingData) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang tải hồ sơ bệnh nhân...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary">Không có quyền truy cập</h2>
          <p className="text-text-secondary text-sm">{error}</p>
          <Link href="/dashboard/doctor/patients" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            ← Quay lại danh sách bệnh nhân
          </Link>
        </div>
      </div>
    );
  }

  const recordTypes = ['all', ...Array.from(new Set(records.map(r => r.type_label)))];
  const filteredRecords = activeTab === 'all' ? records : records.filter(r => r.type_label === activeTab);

  const getRecordIcon = (type: string) => {
    if (type === 'xet-nghiem-mau') return { bg: 'bg-red-100', color: 'text-red-500', path: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' };
    if (type === 'don-thuoc') return { bg: 'bg-amber-100', color: 'text-amber-500', path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
    return { bg: 'bg-primary-light', color: 'text-primary', path: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' };
  };

  const age = patient?.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/doctor" className="hover:text-primary transition-colors">Dashboard</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/dashboard/doctor/patients" className="hover:text-primary transition-colors">Bệnh nhân</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-text-primary font-medium">{patient?.full_name ?? 'Bệnh nhân'}</span>
      </div>

      {/* Patient Profile Card */}
      {patient && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {patient.full_name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{patient.full_name}</h2>
                  <p className="text-text-secondary text-sm mt-0.5">
                    {age ? `${age} tuổi` : ''}
                    {patient.gender ? ` · ${patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : patient.gender}` : ''}
                    {patient.blood_group ? ` · Nhóm máu ${patient.blood_group}` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                  Bệnh nhân
                </span>
              </div>

              {/* Health Info Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {patient.phone && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-text-secondary">Điện thoại</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{patient.phone}</p>
                  </div>
                )}
                {patient.insurance_number && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-text-secondary">Số BHYT</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5 font-mono">{patient.insurance_number}</p>
                  </div>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                    <p className="text-xs text-red-600 font-semibold">⚠ Dị ứng</p>
                    <p className="text-sm font-semibold text-red-700 mt-0.5">{patient.allergies.join(', ')}</p>
                  </div>
                )}
                {patient.chronic_diseases && patient.chronic_diseases.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-amber-600 font-semibold">Bệnh mãn tính</p>
                    <p className="text-sm font-semibold text-amber-700 mt-0.5">{patient.chronic_diseases.join(', ')}</p>
                  </div>
                )}
                {patient.emergency_contact && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 col-span-2">
                    <p className="text-xs text-blue-600 font-semibold">Liên hệ khẩn cấp</p>
                    <p className="text-sm font-semibold text-blue-700 mt-0.5">
                      {patient.emergency_contact.name} ({patient.emergency_contact.relationship}) — {patient.emergency_contact.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              Hồ sơ sức khỏe
              <span className="ml-2 text-sm font-normal text-text-secondary">({records.length} hồ sơ)</span>
            </h2>
          </div>
          {/* Type tabs */}
          <div className="flex gap-2 flex-wrap">
            {recordTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'Tất cả' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Records List */}
        <div className="divide-y divide-border">
          {filteredRecords.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-text-secondary">Không có hồ sơ nào.</p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const icon = getRecordIcon(record.type);
              return (
                <div key={record.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${icon.bg}`}>
                      <svg className={`w-5 h-5 ${icon.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-text-primary">{record.name}</p>
                          <p className="text-sm text-text-secondary mt-0.5">
                            {record.type_label}
                            {record.hospital && ` · ${record.hospital}`}
                            {record.doctor && ` · BS. ${record.doctor}`}
                          </p>
                        </div>
                        <span className="text-xs text-text-secondary flex-shrink-0">
                          {new Date(record.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {record.description && (
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2">{record.description}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {/* Blockchain badge */}
                        {record.blockchain_status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Blockchain verified
                          </span>
                        )}

                        {/* Transaction hash */}
                        {record.transaction_hash && (
                          <span className="text-xs text-text-secondary font-mono truncate max-w-[200px]">
                            TX: {record.transaction_hash.substring(0, 20)}...
                          </span>
                        )}

                        {/* File actions */}
                        {record.file_url && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); handleViewFile(record.id); }}
                              disabled={openingFile === record.id}
                              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline disabled:opacity-50"
                            >
                              {openingFile === record.id ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                              {openingFile === record.id ? 'Đang mở...' : 'Xem'}
                            </button>
                            <span className="text-gray-300">|</span>
                            <a
                              href={`/api/doctor/patients/${patientId}/records/${record.id}/file?download=true`}
                              className="inline-flex items-center gap-1 text-xs text-text-secondary font-semibold hover:text-text-primary hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Tải về
                            </a>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={e => { e.stopPropagation(); router.push(`/dashboard/doctor/ai-chat?patientId=${patientId}&recordId=${record.id}`); }}
                              className="inline-flex items-center gap-1 text-xs text-secondary font-semibold hover:text-secondary-dark hover:underline cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Hỏi đáp AI
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
