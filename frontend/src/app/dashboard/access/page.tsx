'use client';

import { useState } from 'react';
import { accessPermissions } from '@/data/mockData';

export default function AccessPage() {
  const [showForm, setShowForm] = useState(false);
  const activePermissions = accessPermissions.filter(p => p.status === 'active');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Quản lý quyền truy cập</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">
          + Cấp quyền mới
        </button>
      </div>

      {/* Grant Access Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-primary">
          <h2 className="text-lg font-bold text-text-primary mb-4">Cấp quyền cho bác sĩ</h2>
          <div className="space-y-4">
            <input placeholder="Tên bác sĩ hoặc bệnh viện" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
            <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary">
              <option>7 ngày</option>
              <option>30 ngày</option>
              <option>90 ngày</option>
              <option>Vĩnh viễn</option>
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm text-text-primary">Cho phép xem tất cả hồ sơ</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-gray-100 text-text-primary rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all">Hủy</button>
              <button className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">Cấp quyền ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Doctors List */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
        {activePermissions.map((doc, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
                {doc.doctorName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{doc.doctorName}</p>
                <p className="text-sm text-text-secondary">{doc.hospital}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Hết hạn: {new Date(doc.expiryDate).toLocaleDateString('vi-VN')}</p>
              <button className="text-danger text-xs font-medium hover:underline">Thu hồi</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}