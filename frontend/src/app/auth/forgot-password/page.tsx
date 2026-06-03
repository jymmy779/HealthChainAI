'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/30 to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 lg:p-8 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-warning-light rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mt-4">Khôi phục mật khẩu</h1>
            <p className="text-text-secondary mt-1">
              {step === 1 ? 'Nhập số điện thoại hoặc email của bạn' : step === 2 ? 'Nhập mã OTP được gửi đến bạn' : 'Đặt mật khẩu mới'}
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                }`}>{s}</div>
                {s < 3 && <div className="flex-1 h-0.5 bg-gray-100"><div className={`h-full bg-primary transition-all ${step > s ? 'w-full' : 'w-0'}`} /></div>}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <input placeholder="Số điện thoại hoặc email" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
              <button onClick={() => setStep(2)} className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">
                Gửi mã OTP
              </button>
              <Link href="/auth/login" className="block text-center text-primary font-medium hover:underline text-sm">Quay lại đăng nhập</Link>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {[1,2,3,4,5,6].map((i) => (
                  <input key={i} maxLength={1} className="w-12 h-14 text-center text-xl font-bold bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all" autoFocus={i === 1} />
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">
                Xác nhận
              </button>
              <p className="text-center text-sm text-text-secondary">
                Chưa nhận được mã? <button className="text-primary font-medium hover:underline">Gửi lại (60s)</button>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Mật khẩu mới</label>
                <input type="password" placeholder="Nhập mật khẩu mới" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Xác nhận mật khẩu mới</label>
                <input type="password" placeholder="Nhập lại mật khẩu" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
              </div>
              <button onClick={() => router.push('/auth/login')} className="w-full py-3.5 bg-secondary text-white rounded-2xl font-semibold text-base hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/25">
                Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
