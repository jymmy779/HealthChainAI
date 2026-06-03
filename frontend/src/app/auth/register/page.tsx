'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/30 to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 lg:p-8 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mt-4">Tạo tài khoản</h1>
            <p className="text-text-secondary mt-1">Bắt đầu hành trình sức khỏe của bạn</p>
          </div>

          {/* Steps */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Họ và tên</label>
                  <input placeholder="Nhập họ và tên" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Số điện thoại</label>
                  <div className="flex gap-2">
                    <div className="w-20 bg-gray-50 rounded-xl border border-border flex items-center justify-center text-sm font-medium">+84</div>
                    <input type="tel" placeholder="Nhập số điện thoại" className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Email (tùy chọn)</label>
                  <input type="email" placeholder="Nhập email" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Ngày sinh</label>
                    <input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Giới tính</label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary">
                      <option>Nam</option>
                      <option>Nữ</option>
                      <option>Khác</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Mật khẩu</label>
                  <input type="password" placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Xác nhận mật khẩu</label>
                  <input type="password" placeholder="Nhập lại mật khẩu" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm text-text-secondary">Tôi đồng ý với <button className="text-primary hover:underline">Điều khoản bảo mật dữ liệu</button></span>
                </label>
              </>
            )}

            <button type="submit" className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-[0.98]">
              {step === 1 ? 'Tiếp tục' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-text-secondary mt-6 text-base">
            Đã có tài khoản? <Link href="/auth/login" className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
