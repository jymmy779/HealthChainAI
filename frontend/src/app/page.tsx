'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/30 to-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Splash Screen Content */}
        <div className="text-center space-y-8 animate-fadeIn">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary">
              HealthChain <span className="text-primary">AI</span>
            </h1>
            <p className="text-text-secondary mt-2 text-lg">
              Quản lý hồ sơ sức khỏe an toàn, thông minh
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Bảo mật Blockchain' },
              { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: 'AI dự đoán sức khỏe' },
              { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: 'Lưu trữ hồ sơ' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="w-10 h-10 bg-primary-light/50 rounded-lg flex items-center justify-center mx-auto">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <p className="text-xs font-medium text-text-primary mt-2">{feature.label}</p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Link
              href="/auth/login"
              className="block w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="block w-full py-3.5 bg-white text-text-primary border-2 border-border rounded-2xl font-semibold text-base hover:border-primary hover:text-primary transition-all active:scale-[0.98]"
            >
              Tạo tài khoản mới
            </Link>
            <p className="text-sm text-text-secondary">
              Tiếp tục với{' '}
              <button className="text-primary font-medium hover:underline">Passkey</button>
              {' '}hoặc{' '}
              <button className="text-primary font-medium hover:underline">Google</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
