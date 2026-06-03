'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

function OTPFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const { verifyOtp, signInWithPhone } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = otp.join('');
    if (token.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số của mã OTP');
      return;
    }

    setLoading(true);

    try {
      const { error: err } = await verifyOtp(phone, token);
      if (err) {
        setError(err);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await signInWithPhone(phone);
      if (err) {
        setError(err);
      } else {
        setTimeLeft(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi lại mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (num: string) => {
    if (!num) return '';
    if (num.length > 7) {
      return num.slice(0, 4) + '***' + num.slice(-3);
    }
    return num;
  };

  return (
    <div className="w-full max-w-md animate-fadeIn">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Xác thực mã OTP</h1>
        <p className="text-text-secondary mt-2 text-base">
          Mã xác thực đã được gửi đến số điện thoại
        </p>
        <p className="text-primary font-bold text-base mt-1">{maskPhone(phone)}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3.5 bg-danger-light/20 border border-danger/20 rounded-xl text-danger text-sm font-medium">
          {error}
        </div>
      )}

      {/* OTP Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 space-y-6">
        <div>
          <p className="text-sm font-semibold text-text-primary text-center mb-4">
            Nhập mã OTP (6 số)
          </p>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-xl font-bold bg-gray-50 border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-text-primary disabled:opacity-60"
              />
            ))}
          </div>
        </div>

        {/* Timer & Resend */}
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-text-secondary text-sm">
              Gửi lại mã sau <span className="font-bold text-primary">{timeLeft}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-primary font-semibold text-sm hover:underline disabled:opacity-50"
            >
              Gửi lại mã OTP
            </button>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Xác thực
        </Button>

        {/* Back */}
        <div className="text-center">
          <Link href="/auth/login" className="text-text-secondary text-sm hover:text-primary transition-colors">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </form>

      {/* Info */}
      <p className="text-center text-xs text-text-secondary mt-6">
        Mã OTP có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.
      </p>
    </div>
  );
}

export default function OTPPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md text-center py-8">
          <p className="text-text-secondary font-medium">Đang tải...</p>
        </div>
      }>
        <OTPFormContainer />
      </Suspense>
    </div>
  );
}