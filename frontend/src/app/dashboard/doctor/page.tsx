'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { AccessPermission } from '@/lib/types';
import Modal from '@/components/ui/Modal';

export default function DoctorDashboardPage() {
  const { profile, loading, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  // Certificate Upload States
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [certSuccess, setCertSuccess] = useState<string | null>(null);

  const handleUploadCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setCertError('Kích thước file quá lớn (tối đa 10MB).');
      return;
    }

    setUploadingCert(true);
    setCertError(null);
    setCertSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/doctor/upload-certificate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setCertError(data.detail || 'Lỗi tải lên chứng chỉ.');
      } else {
        setCertSuccess(data.message || 'Tải lên minh chứng thành công! Hồ sơ đang được xử lý.');
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
      }
    } catch (err: any) {
      setCertError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setUploadingCert(false);
    }
  };

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

  // ─────────────────────────────────────────────────────────
  // Chưa xác minh: hiển thị trang chờ xác minh toàn màn hình
  // ─────────────────────────────────────────────────────────
  if (!profile.is_verified) {
    const steps = [
      { done: true,                       label: 'Tạo tài khoản bác sĩ thành công' },
      { done: !!profile.license_number,   label: `Cung cấp số chứng chỉ hành nghề${profile.license_number ? ` (${profile.license_number})` : ''}` },
      { done: !!profile.certificate_url,  label: 'Tải lên minh chứng CCHN (Ảnh chụp/PDF)' },
      { done: false,                      label: 'Admin xem xét và phê duyệt hồ sơ' },
      { done: false,                      label: 'Tài khoản được kích hoạt đầy đủ' },
    ];

    return (
      <>
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center animate-fadeIn px-4 py-8">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" />
              </svg>
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Tài khoản đang chờ xác minh</h1>
            <p className="text-text-secondary mt-2 text-sm leading-relaxed">
              Xin chào Bác sĩ <span className="font-semibold text-text-primary">{profile.full_name}</span>!
              Tài khoản của bạn đã được tạo thành công. Vui lòng cung cấp minh chứng CCHN và chờ quản trị viên xác minh thông tin trong vòng <strong>1–2 ngày làm việc</strong>.
            </p>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-left space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Quy trình xác minh</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  {step.done ? (
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className={`text-sm ${step.done ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Profile summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Thông tin đã đăng ký</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-text-secondary">Chuyên khoa: </span><span className="font-medium">{profile.specialty || '—'}</span></div>
              <div><span className="text-text-secondary">Bệnh viện: </span><span className="font-medium">{profile.hospital || '—'}</span></div>
              <div className="col-span-2"><span className="text-text-secondary">Mã chứng chỉ: </span><span className="font-mono font-medium">{profile.license_number || 'Chưa cập nhật'}</span></div>
            </div>
          </div>

          {/* Minh chứng upload area */}
          {!profile.certificate_url ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-left space-y-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Tải lên minh chứng CCHN (Ảnh chụp / PDF)
              </p>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary transition-all relative cursor-pointer">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleUploadCert}
                  disabled={uploadingCert}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className="space-y-2">
                  <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-text-primary">
                    Kéo thả hoặc click để chọn file minh chứng
                  </p>
                  <p className="text-xs text-text-secondary">
                    Hỗ trợ ảnh JPG, PNG hoặc file PDF (tối đa 10MB)
                  </p>
                </div>
              </div>
              {uploadingCert && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-primary font-semibold animate-pulse bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <div className="w-4.5 h-4.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải lên & chạy xác thực AI tự động (khoảng 3-5 giây)...</span>
                </div>
              )}
              {certError && (
                <p className="text-xs text-danger font-medium bg-danger-light/10 p-2.5 rounded-lg">{certError}</p>
              )}
              {certSuccess && (
                <p className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">{certSuccess}</p>
              )}
            </div>
          ) : (
            <div className={`border rounded-2xl p-5 text-left space-y-3 ${
              profile.verification_status === 'failed'
                ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                : profile.verification_status === 'pending'
                ? 'bg-blue-50/40 border-blue-100 text-blue-900'
                : 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {profile.verification_status === 'failed' ? (
                  <>
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-amber-800">Xác thực tự động bằng AI không thành công</span>
                  </>
                ) : profile.verification_status === 'pending' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span className="text-blue-800">Đang chờ Admin duyệt thủ công</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-emerald-700">Minh chứng đã được tải lên thành công</span>
                  </>
                )}
              </div>

              {profile.verification_status === 'failed' ? (
                <div className="space-y-2 text-xs">
                  <p className="text-text-secondary leading-relaxed">
                    Hệ thống AI không thể đối khớp thông tin từ file bạn đã tải lên với thông tin đăng ký (Họ tên hoặc Số CCHN không khớp, hoặc định dạng file không rõ nét).
                  </p>
                  {profile.verification_feedback && (
                    <div className="bg-amber-100/50 border border-amber-200/60 p-2.5 rounded-lg text-amber-900 italic font-medium leading-normal">
                      {profile.verification_feedback}
                    </div>
                  )}
                  <p className="text-text-secondary font-medium">
                    ⚠️ Hồ sơ của bạn đã được chuyển vào hàng đợi phê duyệt thủ công. Quản trị viên sẽ kiểm tra trực quan và duyệt tài khoản cho bạn trong vòng 1-2 ngày.
                  </p>
                </div>
              ) : profile.verification_status === 'pending' ? (
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tài liệu của bạn đang được hàng đợi duyệt thủ công của Admin xử lý. 
                  {profile.verification_feedback && (
                    <span className="block mt-1.5 font-medium text-blue-800 bg-blue-50 border border-blue-100 p-2 rounded-lg">
                      Trạng thái: {profile.verification_feedback}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tài liệu minh chứng CCHN của bạn đã được ghi nhận trên hệ thống. 
                  Bạn có thể xem lại file tài liệu hoặc tải lên file mới để thay thế nếu muốn.
                </p>
              )}
              
              <div className={`flex items-center justify-between bg-white border rounded-xl p-3 text-xs ${
                profile.verification_status === 'failed'
                  ? 'border-amber-100'
                  : profile.verification_status === 'pending'
                  ? 'border-blue-100'
                  : 'border-emerald-100'
              }`}>
                <span className={`font-semibold truncate max-w-[200px] ${
                  profile.verification_status === 'failed'
                    ? 'text-amber-900'
                    : profile.verification_status === 'pending'
                    ? 'text-blue-900'
                    : 'text-emerald-800'
                }`}>{profile.certificate_name || 'Chung_Chi_Hanh_Nghe.pdf'}</span>
                <div className="flex gap-3 flex-shrink-0">
                  <a href={profile.certificate_url} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Xem file</a>
                  <label className="text-text-secondary font-semibold hover:underline cursor-pointer">
                    Thay thế
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadCert} className="hidden" />
                  </label>
                </div>
              </div>
              {uploadingCert && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-primary font-semibold animate-pulse bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <div className="w-4.5 h-4.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải lên và tiến hành xác thực AI tự động...</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/profile"
              className="flex-1 py-3 border-2 border-primary/20 text-primary font-semibold rounded-xl text-sm hover:bg-primary-light/10 transition-all text-center">
              Cập nhật thông tin
            </Link>
            <button
              onClick={() => setShowConfirmLogout(true)}
              className="flex-1 py-3 bg-gray-100 text-text-primary rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all text-center"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        title="Xác nhận đăng xuất"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống HealthChainAI không?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirmLogout(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text-primary rounded-xl text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                setShowConfirmLogout(false);
                await signOut();
              }}
              className="px-4 py-2 bg-danger hover:bg-danger-dark text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </Modal>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Đã xác minh: hiển thị dashboard đầy đủ
  // ─────────────────────────────────────────────────────────
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm bg-emerald-50 border-emerald-200 text-emerald-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tài khoản đã xác minh
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">
              {profile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-xs text-text-secondary">Họ và tên</p><p className="font-semibold text-text-primary">{profile.full_name}</p></div>
            <div><p className="text-xs text-text-secondary">Email</p><p className="font-semibold text-text-primary">{profile.email || '—'}</p></div>
            <div><p className="text-xs text-text-secondary">Chuyên khoa</p><p className="font-semibold text-text-primary">{profile.specialty || '—'}</p></div>
            <div><p className="text-xs text-text-secondary">Bệnh viện / Cơ sở</p><p className="font-semibold text-text-primary">{profile.hospital || '—'}</p></div>
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
        <Link href="/dashboard/doctor/patients"
          className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all block group">
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
            Xem ngay <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>

        <Link href="/dashboard/profile"
          className="bg-white rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-all block group">
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
            Chỉnh sửa <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      </div>

      {/* Recent Patients */}
      {activePatients.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Bệnh nhân gần đây</h2>
            <Link href="/dashboard/doctor/patients" className="text-sm font-semibold text-primary hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {activePatients.slice(0, 3).map((perm) => (
              <Link key={perm.id} href={`/dashboard/doctor/patients/${perm.patient_id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary text-sm">{(perm.patient?.full_name ?? 'B').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{perm.patient?.full_name ?? 'Bệnh nhân'}</p>
                  <p className="text-sm text-text-secondary">Hết hạn: {new Date(perm.expiry_date).toLocaleDateString('vi-VN')} · {perm.total_accesses} lượt truy cập</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium flex-shrink-0">
                  {perm.access_level === 'all' ? 'Toàn bộ' : perm.access_level === 'limited' ? 'Giới hạn' : 'Đơn lẻ'}
                </span>
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
            Bệnh nhân cần chủ động cấp quyền truy cập hồ sơ cho bạn từ trang &quot;Quyền truy cập&quot; của họ.
          </p>
        </div>
      )}
    </div>
  );
}
