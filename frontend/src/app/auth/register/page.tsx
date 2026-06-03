'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  // Step 1 Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Nam');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');

  // Step 2 Fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (role === 'doctor') {
      if (!specialty.trim()) {
        setError('Vui lòng nhập chuyên khoa');
        return;
      }
      if (!hospital.trim()) {
        setError('Vui lòng nhập bệnh viện công tác');
        return;
      }
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản bảo mật dữ liệu');
      return;
    }

    setLoading(true);

    try {
      // Format phone to E.164
      let formattedPhone = phone.trim();
      if (formattedPhone) {
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.startsWith('0')) {
            formattedPhone = '+84' + formattedPhone.slice(1);
          } else {
            formattedPhone = '+84' + formattedPhone;
          }
        }
      }

      const { error: err } = await signUp({
        email,
        password,
        fullName,
        phone: formattedPhone || undefined,
        dateOfBirth: role === 'patient' ? dateOfBirth || undefined : undefined,
        gender: role === 'patient' ? gender : undefined,
        role,
        specialty: role === 'doctor' ? specialty : undefined,
        hospital: role === 'doctor' ? hospital : undefined,
      });

      if (err) {
        setError(err);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/30 to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 lg:p-8 animate-fadeIn">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mt-4">Tạo tài khoản</h1>
            <p className="text-text-secondary mt-1">Bắt đầu hành trình sức khỏe của bạn</p>
          </div>

          {/* Role selector - only allowed in step 1 */}
          {step === 1 && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  role === 'patient' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Bệnh nhân
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  role === 'doctor' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Bác sĩ
              </button>
            </div>
          )}

          {/* Steps Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                }`}>{s}</div>
                <span className={`text-sm font-medium ${step >= s ? 'text-primary' : 'text-text-secondary'}`}>
                  {s === 1 ? 'Thông tin' : 'Bảo mật'}
                </span>
                {s === 1 && <div className="flex-1 h-0.5 bg-gray-100"><div className={`h-full bg-primary transition-all ${step > 1 ? 'w-full' : 'w-0'}`} /></div>}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 bg-danger-light/20 border border-danger/20 rounded-xl text-danger text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Số điện thoại (tùy chọn)</label>
                <div className="flex gap-2">
                  <div className="w-20 bg-gray-50 rounded-xl border border-border flex items-center justify-center text-sm font-medium text-text-primary">+84</div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                  />
                </div>
              </div>

              {role === 'patient' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Ngày sinh</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Giới tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Chuyên khoa</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ví dụ: Tim mạch, Nhi khoa..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Bệnh viện công tác</label>
                    <input
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="Tên bệnh viện / phòng khám"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
              >
                Tiếp tục
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary disabled:opacity-60"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Tôi đồng ý với <span className="text-primary hover:underline font-medium">Điều khoản bảo mật dữ liệu</span> của HealthChain AI</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-1/3 py-3.5 bg-gray-100 text-text-primary rounded-2xl font-semibold text-base hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-text-secondary mt-6 text-base">
            Đã có tài khoản? <Link href="/auth/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

