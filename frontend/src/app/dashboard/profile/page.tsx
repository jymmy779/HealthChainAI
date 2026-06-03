'use client';

import { useState } from 'react';
import { currentUser } from '@/data/mockData';
import Link from 'next/link';

export default function ProfilePage() {
  const user = currentUser;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Avatar & Basic Info */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm text-center">
        <div className="relative inline-block">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white mx-auto shadow-lg">
            {user.name.charAt(0)}
          </div>
          <button className="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 border-2 border-white">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mt-4">{user.name}</h1>
        <p className="text-text-secondary text-base">{user.email}</p>
        <div className="flex justify-center gap-2 mt-3">
          <span className="px-3 py-1 bg-primary-light/40 text-primary text-sm font-medium rounded-full">{user.bloodGroup}</span>
          <span className="px-3 py-1 bg-secondary-light/40 text-secondary text-sm font-medium rounded-full">BMI: {user.bmi}</span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">Thông tin cá nhân</h2>
          <Link href="/dashboard/profile/edit" className="text-primary text-sm font-semibold hover:underline">Chỉnh sửa</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Ngày sinh', value: user.dateOfBirth },
            { label: 'Giới tính', value: user.gender },
            { label: 'Chiều cao', value: user.height },
            { label: 'Cân nặng', value: user.weight },
            { label: 'Nhóm máu', value: user.bloodGroup },
            { label: 'Dị ứng', value: user.allergies || 'Không có' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{item.label}</p>
              <p className="text-base font-semibold text-text-primary mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Health Conditions */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Bệnh mãn tính đang điều trị</h2>
        {user.chronicDiseases.length > 0 ? (
          <div className="space-y-3">
            {user.chronicDiseases.map((c, i) => (
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
    </div>
  );
}
