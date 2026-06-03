'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function PasskeyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError('');
    // Simulate WebAuthn passkey authentication
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    // Simulate success
    router.push('/dashboard');
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Đăng nhập nhanh</h1>
          <p className="text-text-secondary mt-2 text-base">
            Sử dụng vân tay, khuôn mặt hoặc mã PIN
          </p>
        </div>

        {/* Passkey Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-6">
          {/* Animated Fingerprint Icon */}
          <div className="relative w-28 h-28 mx-auto">
            <div className={`absolute inset-0 rounded-full bg-primary-light animate-ping ${loading ? 'opacity-30' : 'opacity-0'}`} />
            <div className={`relative w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
              loading ? 'border-primary bg-primary-light/30 scale-105' : 'border-border bg-gray-50'
            }`}>
              <svg className={`w-14 h-14 ${loading ? 'text-primary' : 'text-text-secondary'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger-light text-danger rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Status Text */}
          <div>
            {loading ? (
              <div className="space-y-2">
                <p className="text-text-primary font-semibold text-lg">Đang xác thực...</p>
                <p className="text-text-secondary text-sm">Vui lòng chạm vào cảm biến vân tay</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-text-primary font-semibold text-lg">Sẵn sàng xác thực</p>
                <p className="text-text-secondary text-sm">Nhấn vào nút bên dưới để bắt đầu</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handlePasskeyLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? 'Đang xác thực...' : 'Xác thực bằng Passkey'}
            </Button>

            <Button
              onClick={handleSkip}
              variant="ghost"
              size="md"
              fullWidth
            >
              Sử dụng phương thức khác
            </Button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Dữ liệu sinh trắc học của bạn được lưu trữ an toàn trên thiết bị và không được gửi đến máy chủ.
        </p>
      </div>
    </div>
  );
}