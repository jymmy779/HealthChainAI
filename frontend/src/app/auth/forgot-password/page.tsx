'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, updatePassword } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === '3') {
      setStep(3);
    }
  }, [searchParams]);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: err } = await resetPassword(email.trim());
      if (err) {
        setError(err);
      } else {
        setSuccess('Link khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
        setStep(2); // Show confirmation step
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: err } = await updatePassword(password);
      if (err) {
        setError(err);
      } else {
        setSuccess('Đổi mật khẩu thành công! Bạn đang được chuyển hướng về trang đăng nhập...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 lg:p-8 animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-warning-light rounded-2xl flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mt-4">Khôi phục mật khẩu</h1>
        <p className="text-text-secondary mt-1">
          {step === 1 ? 'Nhập email của bạn để nhận link khôi phục' : step === 2 ? 'Kiểm tra hòm thư của bạn' : 'Đặt mật khẩu mới của bạn'}
        </p>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-4 p-3.5 bg-danger-light/20 border border-danger/20 rounded-xl text-danger text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3.5 bg-secondary-light/20 border border-secondary/20 rounded-xl text-secondary-dark text-sm font-medium">
          {success}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendResetLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Email tài khoản</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi link khôi phục'}
          </button>
          <Link href="/auth/login" className="block text-center text-primary font-medium hover:underline text-sm">Quay lại đăng nhập</Link>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4 text-center">
          <p className="text-text-secondary text-base">
            Chúng tôi đã gửi hướng dẫn đổi mật khẩu tới email <strong className="text-text-primary">{email}</strong>. 
            Vui lòng nhấn vào liên kết trong email để tiếp tục.
          </p>
          <Link href="/auth/login" className="block text-center py-3.5 bg-gray-100 text-text-primary rounded-2xl font-semibold text-base hover:bg-gray-200 transition-all">
            Quay lại đăng nhập
          </Link>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/30 to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-text-secondary font-medium">Đang tải...</p>
          </div>
        }>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

