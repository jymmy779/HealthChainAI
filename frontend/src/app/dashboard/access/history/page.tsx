'use client';

import { useState } from 'react';
import { useAccessLogs, useAccessPermissions } from '@/hooks/useData';
import type { AccessLog } from '@/lib/types';

export default function AccessHistoryPage() {
  const [filter, setFilter] = useState('all');
  const { data: logs, loading: loadingLogs } = useAccessLogs();
  const { data: permissions, loading: loadingPermissions } = useAccessPermissions();

  const activePermissions = permissions.filter(p => p.status === 'active');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return log.accessed_at.startsWith(today);
    }
    if (filter === 'viewed') {
      return log.action === 'viewed' || log.action === 'viewed_records';
    }
    return log.action === filter;
  });

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'viewed':
      case 'viewed_records':
        return { bg: 'bg-primary-light text-primary', label: 'Xem hồ sơ', icon: 'eye' };
      case 'granted':
        return { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'Cấp quyền', icon: 'key' };
      case 'revoked':
        return { bg: 'bg-rose-50 text-rose-600 border border-rose-200', label: 'Thu hồi', icon: 'x-circle' };
      case 'expired':
        return { bg: 'bg-gray-100 text-text-secondary', label: 'Hết hạn', icon: 'clock' };
      default:
        return { bg: 'bg-gray-100 text-text-secondary', label: action, icon: 'info' };
    }
  };




  const loading = loadingLogs || loadingPermissions;

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Lịch sử truy cập</h1>
        <p className="text-text-secondary mt-1">Theo dõi hoạt động xem hồ sơ và quản lý quyền của các bác sĩ</p>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{logs.length}</p>
              <p className="text-xs text-text-secondary">Nhật ký hoạt động</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600">{logs.filter(l => l.action === 'viewed' || l.action === 'viewed_records').length}</p>
              <p className="text-xs text-text-secondary">Số lượt xem hồ sơ</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{activePermissions.length}</p>
              <p className="text-xs text-text-secondary">Bác sĩ đang có quyền xem</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'today', label: 'Hôm nay' },
          { value: 'viewed', label: 'Lượt xem hồ sơ' },
          { value: 'granted', label: 'Lượt cấp quyền' },
          { value: 'revoked', label: 'Lượt thu hồi' },
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
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-text-secondary">Chưa có hoạt động truy cập nào phù hợp</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const actionStyle = getActionStyle(log.action);
              return (
                <div
                  key={log.id || index}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        log.action === 'viewed' || log.action === 'viewed_records'
                          ? 'bg-primary-light text-primary'
                          : actionStyle.bg
                      }`}>
                        {actionStyle.icon === 'eye' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : actionStyle.icon === 'key' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : actionStyle.icon === 'x-circle' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>

                      {/* Log details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-text-primary text-base">
                            {log.doctor?.full_name || 'Bác sĩ ẩn danh'}
                          </span>
                          <span className="text-text-secondary text-sm">({log.doctor?.specialty || 'Chuyên khoa'} - {log.doctor?.hospital || 'Bệnh viện'})</span>
                        </div>

                        <p className="text-sm text-text-primary">
                          {log.action === 'viewed' || log.action === 'viewed_records' ? (
                            <>
                              Đã xem hồ sơ: <strong className="text-primary">{log.record_name || 'Tất cả hồ sơ'}</strong>
                            </>
                          ) : log.action === 'granted' ? (
                            'Được cấp quyền truy cập hồ sơ sức khỏe mới'
                          ) : log.action === 'revoked' ? (
                            'Bị thu hồi quyền truy cập hồ sơ sức khỏe'
                          ) : (
                            'Thực hiện hành động bảo mật'
                          )}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(log.accessed_at).toLocaleDateString('vi-VN')} vào lúc {new Date(log.accessed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1">
                              IP: {log.ip_address}
                            </span>
                          )}
                          {log.device_info && (
                            <span className="hidden sm:inline truncate max-w-xs text-gray-400" title={log.device_info}>
                              Thiết bị: {log.device_info.split(' ')[0]} ({log.device_info.includes('Windows') ? 'Windows' : log.device_info.includes('Macintosh') ? 'macOS' : 'Thiết bị khác'})
                            </span>
                          )}
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