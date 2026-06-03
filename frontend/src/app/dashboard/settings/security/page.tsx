'use client';

import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
          <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Bảo mật</h1>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Đổi mật khẩu</h2>
        <div className="space-y-4">
          <input type="password" placeholder="Mật khẩu hiện tại" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
          <input type="password" placeholder="Mật khẩu mới" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
          <input type="password" placeholder="Xác nhận mật khẩu mới" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
          <button className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">Cập nhật mật khẩu</button>
        </div>
      </div>

      {/* Passkey */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Passkey (Vân tay / Face ID)</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">Sử dụng Passkey để đăng nhập</p>
            <p className="text-sm text-text-secondary">Nhanh chóng và bảo mật hơn</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {/* Devices */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Thiết bị đã đăng nhập</h2>
        <div className="space-y-3">
          {[
            { device: 'iPhone 16 Pro - iOS 19', time: 'Hoạt động 2 phút trước', current: true },
            { device: 'Windows Chrome - Laptop Dell', time: 'Hoạt động 1 giờ trước', current: false },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-light rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-text-primary">{d.device} {d.current && <span className="text-xs text-secondary font-normal">(Hiện tại)</span>}</p>
                  <p className="text-xs text-text-secondary">{d.time}</p>
                </div>
              </div>
              {!d.current && <button className="text-danger text-xs font-medium hover:underline">Đăng xuất</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
