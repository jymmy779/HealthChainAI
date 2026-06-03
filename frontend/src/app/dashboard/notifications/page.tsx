'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useData';
import Link from 'next/link';

export default function NotificationsPage() {
  const [tab, setTab] = useState('all');
  const { data: notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'health': return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'success': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'access': return 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z';
      case 'reminder': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'ai': return 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'health': return 'danger';
      case 'success': return 'secondary';
      case 'access': return 'primary';
      case 'reminder': return 'warning';
      case 'ai': return 'secondary';
      default: return 'primary';
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !n.is_read;
    if (tab === 'health') return n.type === 'health';
    return n.type !== 'health'; // System / other
  });

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Thông báo</h1>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
          { key: 'health', label: 'Sức khỏe' },
          { key: 'system', label: 'Hệ thống' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
          {filteredNotifs.map(n => {
            const color = n.color || getColor(n.type);
            const icon = n.icon || getIcon(n.type);
            // Setup dynamic classes safely
            const iconBgClass =
              color === 'danger' ? 'bg-danger-light' :
              color === 'secondary' ? 'bg-secondary-light' :
              color === 'warning' ? 'bg-warning-light' :
              color === 'primary' ? 'bg-primary-light' : 'bg-gray-100';

            const iconTextClass =
              color === 'danger' ? 'text-danger' :
              color === 'secondary' ? 'text-secondary' :
              color === 'warning' ? 'text-warning' :
              color === 'primary' ? 'text-primary' : 'text-text-secondary';

            return (
              <div key={n.id} className={`p-4 hover:bg-gray-50 transition-all ${!n.is_read ? 'bg-primary-light/5' : ''}`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                    <svg className={`w-5 h-5 ${iconTextClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-text-primary text-sm">{n.title}</p>
                      <span className="text-xs text-text-secondary whitespace-nowrap">{formatTime(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{n.message}</p>
                    <div className="flex gap-3 mt-2">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      {n.link && (
                        <Link href={n.link} className="text-xs text-text-secondary font-medium hover:underline">
                          Xem chi tiết
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              </div>
            );
          })}
          {filteredNotifs.length === 0 && (
            <div className="p-8 text-center text-text-secondary">Không có thông báo nào</div>
          )}
        </div>
      )}
    </div>
  );
}
