'use client';

import { useState } from 'react';

const allNotifications = [
  { id: 1, type: 'health', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Cảnh báo sức khỏe', message: 'Nguy cơ tiểu đường của bạn tăng 12% so với tháng trước.', time: '5 phút trước', read: false, color: 'danger' },
  { id: 2, type: 'success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Blockchain thành công', message: "Hồ sơ 'Xét nghiệm máu 02/06' đã được lưu thành công trên Polygon.", time: '1 giờ trước', read: false, color: 'secondary' },
  { id: 3, type: 'access', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', title: 'Quyền truy cập', message: 'Bác sĩ Trần Thị A đã xem hồ sơ của bạn lúc 14:30.', time: '3 giờ trước', read: false, color: 'primary' },
  { id: 4, type: 'reminder', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Nhắc nhở', message: 'Bạn nên kiểm tra huyết áp tuần này.', time: '1 ngày trước', read: true, color: 'warning' },
  { id: 5, type: 'ai', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'AI sẵn sàng', message: 'Phân tích sức khỏe tháng 6 đã sẵn sàng để xem.', time: '2 ngày trước', read: true, color: 'text-secondary' },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState('all');
  const notifs = tab === 'all' ? allNotifications : tab === 'unread' ? allNotifications.filter(n => !n.read) : allNotifications.filter(n => n.type === tab);

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Thông báo</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
          { key: 'health', label: 'Sức khỏe' },
          { key: 'system', label: 'Hệ thống' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>{t.label}</button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
        {notifs.map(n => (
          <div key={n.id} className={`p-4 hover:bg-gray-50 transition-all ${!n.read ? 'bg-primary-light/5' : ''}`}>
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-${n.color}-light`}>
                <svg className={`w-5 h-5 text-${n.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={n.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-text-primary text-sm">{n.title}</p>
                  <span className="text-xs text-text-secondary whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{n.message}</p>
                <div className="flex gap-3 mt-2">
                  <button className="text-xs text-primary font-medium hover:underline">Đánh dấu đã đọc</button>
                  <button className="text-xs text-text-secondary font-medium hover:underline">Xem chi tiết</button>
                </div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
