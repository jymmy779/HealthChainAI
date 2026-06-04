'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Avatar & Basic Info */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm text-center">
        <div className="relative inline-block">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name} 
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white mx-auto shadow-lg">
              {profile.full_name?.charAt(0) || '?'}
            </div>
          )}
          <Link 
            href="/dashboard/profile/edit"
            className="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 border-2 border-white cursor-pointer"
          >
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mt-4">{profile.full_name}</h1>
        <p className="text-text-secondary text-base">{profile.email}</p>
        <div className="flex justify-center gap-2 mt-3">
          {profile.role === 'doctor' ? (
            <>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                profile.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {profile.is_verified ? 'Đã xác minh CCHN' : 'Chờ xác minh CCHN'}
              </span>
              <span className="px-3 py-1 bg-primary-light/40 text-primary text-sm font-medium rounded-full">
                {profile.specialty || 'Chưa cập nhật chuyên khoa'}
              </span>
            </>
          ) : (
            <>
              <span className="px-3 py-1 bg-primary-light/40 text-primary text-sm font-medium rounded-full">{profile.blood_group || 'Chưa cập nhật'}</span>
              <span className="px-3 py-1 bg-secondary-light/40 text-secondary text-sm font-medium rounded-full">BMI: {profile.weight && profile.height ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : '--'}</span>
            </>
          )}
        </div>
      </div>

      {/* Personal/Professional Information */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">
            {profile.role === 'doctor' ? 'Thông tin bác sĩ' : 'Thông tin cá nhân'}
          </h2>
          <Link href="/dashboard/profile/edit" className="text-primary text-sm font-semibold hover:underline">Chỉnh sửa</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Ngày sinh</p>
            <p className="text-base font-semibold text-text-primary mt-1">{profile.date_of_birth || 'Chưa cập nhật'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Số điện thoại</p>
            <p className="text-base font-semibold text-text-primary mt-1">{profile.phone || 'Chưa cập nhật'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Giới tính</p>
            <p className="text-base font-semibold text-text-primary mt-1">{profile.gender || 'Chưa cập nhật'}</p>
          </div>
          {profile.role === 'doctor' ? (
            <>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Chuyên khoa</p>
                <p className="text-base font-semibold text-text-primary mt-1">{profile.specialty || 'Chưa cập nhật'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Bệnh viện / Cơ sở</p>
                <p className="text-base font-semibold text-text-primary mt-1">{profile.hospital || 'Chưa cập nhật'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 col-span-2">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Số chứng chỉ hành nghề (CCHN)</p>
                <p className="text-base font-semibold text-text-primary font-mono mt-1">{profile.license_number || 'Chưa cập nhật'}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Nhóm máu</p>
                <p className="text-base font-semibold text-text-primary mt-1">{profile.blood_group || 'Chưa cập nhật'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Chiều cao</p>
                <p className="text-base font-semibold text-text-primary mt-1">{profile.height ? `${profile.height} cm` : 'Chưa cập nhật'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Cân nặng</p>
                <p className="text-base font-semibold text-text-primary mt-1">{profile.weight ? `${profile.weight} kg` : 'Chưa cập nhật'}</p>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-xl p-3.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Dị ứng thuốc</p>
                <p className="text-base font-semibold text-text-primary mt-1">
                  {profile.allergies?.length ? profile.allergies.join(', ') : 'Không có'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Role dependent bottom sections */}
      {profile.role === 'doctor' ? (
        profile.certificate_url && (
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-4">Minh chứng CCHN</h2>
            <div className="flex items-center justify-between bg-gray-50 border border-border rounded-xl p-3.5 text-sm">
              <span className="font-semibold text-text-primary truncate max-w-[250px]">
                {profile.certificate_name || 'Chung_Chi_Hanh_Nghe.pdf'}
              </span>
              <a href={profile.certificate_url} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                Xem minh chứng CCHN
              </a>
            </div>
          </div>
        )
      ) : (
        <>
          {/* Health Conditions */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-4">Bệnh mãn tính đang điều trị</h2>
            {profile.chronic_diseases && profile.chronic_diseases.length > 0 ? (
              <div className="space-y-3">
                {profile.chronic_diseases.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-danger-light/20 rounded-xl">
                    <div className="w-8 h-8 bg-danger-light rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{c}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-base">Không có bệnh mãn tính nào</p>
            )}
          </div>

          {/* Blockchain Button */}
          <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-semibold text-base hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Xem hồ sơ trên Blockchain
          </button>
        </>
      )}
    </div>
  );
}
