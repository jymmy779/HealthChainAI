'use client';

import { useState } from 'react';
import { useAccessLogs } from '@/hooks/useData';

export default function AccessHistoryPage() {
  const [filter, setFilter] = useState('all');

  const { data: logs, loading } = useAccessLogs();

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return log.accessed_at.startsWith(today);
    }
    return log.action === filter;
  });

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'viewed': return { bg: 'bg-primary-light', text: 'text-primary', label: 'Đã xem' };
      case 'granted': return { bg: 'bg-secondary-light', text: 'text-secondary', label: 'Cấp quyền' };
      case 'revoked': return { bg: 'bg-warning-light', text: 'text-warning', label: 'Thu hồi' };
      case 'expired': return { bg: 'bg-gray-100', text: 'text-text-secondary', label: 'Hết hạn' };
      default: return { bg: 'bg-gray-100', text: 'text-text-secondary', label: action };
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Lịch sử truy cập</h1>
        <p className="text-text-secondary mt-1">Theo dõi ai đã xem hồ sơ của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{logs.length}</p>
              <p className="text-xs text-text-secondary">Tổng lượt truy cập</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-light rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-6.364A9 9 0 1112 2.036a9 9 0 016.364 2.636z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{logs.filter(l => l.action === 'viewed').length}</p>
              <p className="text-xs text-text-secondary">Lượt xem hồ sơ</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-light rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{logs.filter(l => l.action === 'granted').length}</p>
              <p className="text-xs text-text-secondary">Bác sĩ được cấp quyền</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'today', label: 'Hôm nay' },
          { value: 'viewed', label: 'Đã xem' },
          { value: 'granted', label: 'Cấp quyền' },
          { value: 'revoked', label: 'Thu hồi' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-secondary hover:bg-gray-50 border-2 border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-text-secondary">Chưa có hoạt động truy cập nào</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const actionStyle = getActionStyle(log.action);
            return (
              <div key={index} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${actionStyle.bg}`}>
                    {log.action === 'viewed' ? (
                      <svg className={`w-5 h-5 ${actionStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : log.action === 'granted' ? (
                      <svg className={`w-5 h-5 ${actionStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${actionStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {log.doctor?.full_name}
                        </p>
                        <p className="text-sm text-text-secondary">{log.doctor?.hospital}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${actionStyle.bg} ${actionStyle.text} whitespace-nowrap`}>
                        {actionStyle.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(log.accessed_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(log.accessed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {log.record_name || 'Tất cả hồ sơ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
}