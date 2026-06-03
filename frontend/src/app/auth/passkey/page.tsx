'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function PasskeyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'options' | 'authenticating' | 'verifying' | 'success'>('idle');

  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('options');

    try {
      // Step 1: Generate options
      const optRes = await fetch('/api/auth/passkey/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-options', email }),
      });

      const options = await optRes.json();
      if (!optRes.ok || options.error) {
        throw new Error(options.error || 'Không thể tạo yêu cầu xác thực');
      }

      setStatus('authenticating');

      // Step 2: Browser authentication prompt
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const credential = await startAuthentication(options);

      setStatus('verifying');

      // Step 3: Verify credential with server
      const verifyRes = await fetch('/api/auth/passkey/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          credential,
          userId: options.userId,
        }),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok || verifyResult.error) {
        throw new Error(verifyResult.error || 'Xác thực thất bại');
      }

      setStatus('success');

      if (verifyResult.redirectUrl) {
        router.push(verifyResult.redirectUrl);
      } else {
        // Fallback if Service Role Key is not set up
        setError('Xác thực thành công! Nhưng cần SUPABASE_SERVICE_ROLE_KEY trong env để tự động đăng nhập.');
        setLoading(false);
        setStatus('idle');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Xác thực sinh trắc học bị hủy hoặc thất bại');
      setLoading(false);
      setStatus('idle');
    }
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
          <h1 className="text-2xl font-bold text-text-primary">Đăng nhập bằng Passkey</h1>
          <p className="text-text-secondary mt-2 text-base">
            Sử dụng vân tay, khuôn mặt hoặc mã PIN thiết bị
          </p>
        </div>

        {/* Passkey Card */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-gray-200/50 text-center space-y-6">
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
            <div className="p-3.5 bg-danger-light/20 border border-danger/20 text-danger rounded-xl text-sm font-medium text-left">
              {error}
            </div>
          )}

          {/* Status Text */}
          <div>
            {status === 'options' && (
              <p className="text-text-primary font-semibold text-base">Đang tải thông tin thiết bị...</p>
            )}
            {status === 'authenticating' && (
              <div className="space-y-1">
                <p className="text-text-primary font-semibold text-lg">Đang xác thực sinh trắc học...</p>
                <p className="text-text-secondary text-sm">Vui lòng quét vân tay/khuôn mặt hoặc nhập mã PIN thiết bị</p>
              </div>
            )}
            {status === 'verifying' && (
              <p className="text-text-primary font-semibold text-base">Đang kiểm tra chữ ký với máy chủ...</p>
            )}
            {status === 'success' && (
              <p className="text-primary font-semibold text-base">Xác thực thành công! Đang chuyển hướng...</p>
            )}
            {status === 'idle' && (
              <div className="space-y-1">
                <p className="text-text-primary font-semibold text-base">Sẵn sàng xác thực</p>
                <p className="text-text-secondary text-sm">Nhập email của bạn để bắt đầu</p>
              </div>
            )}
          </div>

          {/* Email input for passkey options retrieval */}
          {status === 'idle' && (
            <form onSubmit={handlePasskeyLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email tài khoản</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email đã đăng ký Passkey"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-text-primary text-base"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                Xác thực bằng Passkey
              </Button>
            </form>
          )}

          {status !== 'idle' && (
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-2/3 mx-auto rounded-full" />
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleSkip}
              variant="ghost"
              size="md"
              fullWidth
              disabled={loading}
            >
              Sử dụng phương thức khác
            </Button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Dữ liệu sinh trắc học của bạn được bảo mật trên phần cứng thiết bị và không bao giờ được gửi lên mạng internet.
        </p>
      </div>
    </div>
  );
}