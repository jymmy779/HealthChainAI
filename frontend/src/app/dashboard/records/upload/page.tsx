'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHealthRecords } from '@/hooks/useData';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { add } = useHealthRecords();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('xet-nghiem-mau');
  const [desc, setDesc] = useState('');
  const [hospital, setHospital] = useState('');
  const [doctor, setDoctor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'uploading' | 'signing' | 'confirming' | 'completed'>('idle');

  const typeLabels: Record<string, string> = {
    'xet-nghiem-mau': 'Xét nghiệm máu',
    'don-thuoc': 'Đơn thuốc',
    'hinh-anh': 'Chẩn đoán hình ảnh',
    'bao-cao': 'Báo cáo bác sĩ',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        const dotIndex = selectedFile.name.lastIndexOf('.');
        const nameWithoutExt = dotIndex !== -1 ? selectedFile.name.substring(0, dotIndex) : selectedFile.name;
        setName(nameWithoutExt);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Vui lòng chọn hoặc kéo thả file');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên hồ sơ');
      return;
    }

    setSubmitting(true);
    setError('');
    setStep('uploading');

    // Prepare the metadata block
    const newRecord = {
      name: name.trim(),
      type,
      type_label: typeLabels[type] || 'Hồ sơ sức khỏe',
      description: desc.trim() || null,
      file_url: null,
      file_size: null,
      date: new Date().toISOString().split('T')[0],
      hospital: hospital.trim() || null,
      doctor: doctor.trim() || null,
      transaction_hash: null,
      ipfs_hash: null,
      blockchain_status: 'pending',
    };

    // Send to backend (the backend will automatically upload to IPFS and write to Solidity contract!)
    const { error: uploadError } = await add(newRecord, file);

    setSubmitting(false);
    setStep('idle');

    if (uploadError) {
      setError(uploadError);
    } else {
      router.push('/dashboard/records');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/records" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
            <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Upload hồ sơ</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File input helper */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              file ? 'border-secondary bg-secondary-light/10' : 'border-border hover:border-primary'
            }`}
            onClick={handleButtonClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const droppedFile = e.dataTransfer.files[0];
                setFile(droppedFile);
                if (!name) {
                  const dotIndex = droppedFile.name.lastIndexOf('.');
                  setName(dotIndex !== -1 ? droppedFile.name.substring(0, dotIndex) : droppedFile.name);
                }
              }
            }}
          >
            {file ? (
              <div>
                <div className="w-16 h-16 bg-secondary-light rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-text-primary mt-3">{file.name}</p>
                <p className="text-sm text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-danger text-sm font-medium hover:underline mt-2"
                >
                  Bỏ chọn
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-base text-text-primary mt-3 font-semibold">Kéo thả file vào đây</p>
                <p className="text-sm text-text-secondary mt-1">hoặc</p>
                <button
                  type="button"
                  className="mt-3 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all"
                >
                  Chọn file từ máy
                </button>
                <p className="text-xs text-text-secondary mt-3">Hỗ trợ: PDF, JPG, PNG (tối đa 10MB)</p>
              </div>
            )}
          </div>

          {/* Document Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Tên hồ sơ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên hồ sơ (Ví dụ: Xét nghiệm tổng quát 2026)"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Loại tài liệu</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'xet-nghiem-mau', label: 'Xét nghiệm máu', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
                { value: 'don-thuoc', label: 'Đơn thuốc', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { value: 'hinh-anh', label: 'Chẩn đoán hình ảnh', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { value: 'bao-cao', label: 'Báo cáo bác sĩ', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    type === opt.value
                      ? 'border-primary bg-primary-light/20 text-primary'
                      : 'border-border hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                  </svg>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Hospital */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Bệnh viện / Phòng khám (tùy chọn)</label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="Ví dụ: Bệnh viện Bạch Mai"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary"
              />
            </div>
            {/* Doctor */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Bác sĩ phụ trách (tùy chọn)</label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Ví dụ: BS. Nguyễn Văn A"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Mô tả (tùy chọn)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nhập mô tả ngắn về hồ sơ này..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-secondary text-white rounded-2xl font-semibold text-base hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/25 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
                </svg>
                <span>Đang xử lý & lưu Blockchain...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Lưu lên Blockchain</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
