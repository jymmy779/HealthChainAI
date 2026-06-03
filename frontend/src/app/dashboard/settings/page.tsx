'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold text-text-primary">Cài đặt</h1>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
        {[
          { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Tài khoản', desc: 'Thông tin tài khoản và bảo mật', href: '/dashboard/profile' },
          { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Bảo mật', desc: 'Mật khẩu, Passkey, quản lý thiết bị', href: '/dashboard/settings/security' },
          { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Thông báo', desc: 'Quản lý thông báo đẩy và email', href: '#' },
          { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Ngôn ngữ', desc: 'Tiếng Việt / English', href: '#' },
        ].map((item, i) => (
          <Link key={i} href={item.href} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{item.label}</p>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-3">Về HealthChain AI</h2>
        <p className="text-text-secondary text-base">Phiên bản 1.0.0</p>
        <div className="mt-3 space-y-2">
          <Link href="#" className="block text-primary font-medium hover:underline">Điều khoản sử dụng</Link>
          <Link href="#" className="block text-primary font-medium hover:underline">Chính sách bảo mật</Link>
          <Link href="#" className="block text-primary font-medium hover:underline">Hỗ trợ / FAQ</Link>
        </div>
      </div>
    </div>
  );
}
