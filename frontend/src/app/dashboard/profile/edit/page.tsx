'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EditProfilePage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: show security modal
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/profile" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
            <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Chỉnh sửa thông tin</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white">
              N
            </div>
            <div>
              <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all">Cập nhật ảnh</button>
              <p className="text-xs text-text-secondary mt-1">JPG, PNG tối đa 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Họ và tên</label>
              <input defaultValue="Nguyễn Văn Nam" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ngày sinh</label>
              <input type="date" defaultValue="1956-05-15" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Giới tính</label>
              <select defaultValue="Nam" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary">
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Chiều cao (cm)</label>
              <input defaultValue="168" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Cân nặng (kg)</label>
              <input defaultValue="65" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nhóm máu</label>
              <select defaultValue="A+" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Dị ứng thuốc</label>
              <textarea placeholder="Liệt kê các dị ứng thuốc (nếu có)" rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base resize-none" />
            </div>
          </div>

          <div className="bg-warning-light/30 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-text-primary">Thay đổi thông tin quan trọng sẽ yêu cầu xác thực lại bằng OTP hoặc Passkey.</p>
          </div>

          <button type="submit" className="w-full py-3.5 bg-secondary text-white rounded-2xl font-semibold text-base hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/25">
            Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
}
