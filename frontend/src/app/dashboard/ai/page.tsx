'use client';

import { useAIPredictions, useHealthRecords } from '@/hooks/useData';
import Link from 'next/link';

export default function AIPage() {
  const { data: currentAnalysis, loading } = useAIPredictions();
  const { data: records, loading: loadingRecords } = useHealthRecords();

  if (loading || loadingRecords) {
    return (
      <div className="flex justify-center py-20 animate-fadeIn">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const predictions = currentAnalysis?.diseases?.map((d: any) => ({
    disease: d.name,
    risk: d.risk,
    description: d.description,
    lastUpdate: currentAnalysis.date || 'Mới cập nhật',
    recommendations: d.recommendations || []
  })) || [];

  const analyzedRecords = records.filter(r => r.metric_id);
  const latestMetricId = analyzedRecords.length > 0 ? analyzedRecords[0].metric_id : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold text-text-primary">Phân tích sức khỏe thông minh</h1>

      {/* Risk Cards or Empty State */}
      {currentAnalysis?.has_data === false ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-border/60 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto text-primary animate-pulse-soft">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-text-primary">Chưa có chỉ số phân tích AI</h3>
            <p className="text-sm text-text-secondary mt-2">
              Chào mừng bạn đến với HealthChain AI! Hãy bắt đầu bằng cách tải lên file báo cáo bệnh lý hoặc tự nhập các chỉ số sức khỏe của bạn để hệ thống tiến hành tính toán nguy cơ lâm sàng.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/dashboard/records/upload" className="py-2.5 px-5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all">
              Tải lên hồ sơ PDF ngay
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((p: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border-l-4 transition-all hover:shadow-md"
              style={{ borderColor: p.risk >= 70 ? '#F44336' : p.risk >= 50 ? '#FF9800' : '#4CAF50' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-text-primary">{p.disease}</h3>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  p.risk >= 70 ? 'bg-danger-light' : p.risk >= 50 ? 'bg-warning-light' : 'bg-secondary-light'
                }`}>
                  <svg className={`w-5 h-5 ${
                    p.risk >= 70 ? 'text-danger' : p.risk >= 50 ? 'text-warning' : 'text-secondary'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
              </div>

              {/* Risk Meter */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Nguy cơ</span>
                  <span className={`font-bold ${
                    p.risk >= 70 ? 'text-danger' : p.risk >= 50 ? 'text-warning' : 'text-secondary'
                  }`}>{p.risk}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p.risk}%`, backgroundColor: p.risk >= 70 ? '#F44336' : p.risk >= 50 ? '#FF9800' : '#4CAF50' }} />
                </div>
              </div>

              <p className="text-sm text-text-secondary">{p.description}</p>
              <p className="text-xs text-text-secondary mt-2">Cập nhật: {p.lastUpdate}</p>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Analysis Button */}
      <Link
        href={latestMetricId ? `/dashboard/ai/report?metric_id=${latestMetricId}` : "/dashboard/ai/report"}
        className="block w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-semibold text-base text-center hover:shadow-lg hover:shadow-primary/25 transition-all"
      >
        Xem báo cáo phân tích chi tiết
      </Link>

      {/* AI History */}
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Lịch sử phân tích</h2>
          <Link href="/dashboard/ai/history" className="text-primary text-sm font-semibold hover:underline">Xem tất cả</Link>
        </div>
        <div className="space-y-3">
          {analyzedRecords.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">Chưa có lịch sử phân tích AI nào.</p>
          ) : (
            analyzedRecords.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/dashboard/ai/report?metric_id=${item.metric_id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">{item.name}</p>
                  <p className="text-sm text-text-secondary">Đã hoàn thành • {item.date}</p>
                </div>
                <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}