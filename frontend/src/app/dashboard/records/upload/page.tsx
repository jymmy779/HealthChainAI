'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('blood_test');
  const [desc, setDesc] = useState('');

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/records" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
            <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Upload hồ sơ</h1>
        </div>

        {/* Drop Zone */}
        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? 'border-secondary bg-secondary-light/10' : 'border-border hover:border-primary'}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}>
          {file ? (
            <div>
              <div className="w-16 h-16 bg-secondary-light rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-base font-semibold text-text-primary mt-3">{file.name}</p>
              <p className="text-sm text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={() => setFile(null)} className="text-danger text-sm font-medium hover:underline mt-2">Bỏ chọn</button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-base text-text-primary mt-3 font-semibold">Kéo thả file vào đây</p>
              <p className="text-sm text-text-secondary mt-1">hoặc</p>
              <button className="mt-3 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">Chọn file từ máy</button>
              <p className="text-xs text-text-secondary mt-3">Hỗ trợ: PDF, JPG, PNG (tối đa 10MB)</p>
            </div>
          )}
        </div>

        {/* Document Type */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-text-primary mb-2">Loại tài liệu</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'blood_test', label: 'Xét nghiệm máu', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
              { value: 'prescription', label: 'Đơn thuốc', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { value: 'diagnostic', label: 'Chẩn đoán hình ảnh', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { value: 'report', label: 'Báo cáo bác sĩ', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setType(opt.value)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${type === opt.value ? 'border-primary bg-primary-light/20 text-primary' : 'border-border hover:border-gray-300'}`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} /></svg>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-text-primary mb-1.5">Mô tả (tùy chọn)</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Nhập mô tả ngắn về hồ sơ này..." rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base resize-none" />
        </div>

        {/* Submit */}
        <button className="w-full mt-6 py-3.5 bg-secondary text-white rounded-2xl font-semibold text-base hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/25 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Lưu lên Blockchain
        </button>
      </div>
    </div>
  );
}
