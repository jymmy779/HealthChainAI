'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useHealthRecords } from '@/hooks/useData';

export default function AIHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: records, loading } = useHealthRecords();

  if (loading) {
    return (
      <div className="flex justify-center py-20 animate-fadeIn">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const analyzedRecords = records.filter(report => {
    const isAnalyzed = !!report.metric_id;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    return isAnalyzed && matchesSearch;
  });

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Lịch sử phân tích AI</h1>
        <p className="text-text-secondary mt-1">Xem lại các kết quả phân tích sức khỏe trước đây</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm phân tích..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none text-base"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {analyzedRecords.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-text-secondary text-base">Chưa có báo cáo phân tích nào</p>
          </div>
        ) : (
          analyzedRecords.map((report) => {
            return (
              <Link
                key={report.id}
                href={`/dashboard/ai/report?metric_id=${report.metric_id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-primary-light"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-light text-primary">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-text-primary text-base">{report.name}</h3>
                        <p className="text-sm text-text-secondary mt-1">{report.date} • {report.hospital || 'Phân tích từ hồ sơ'}</p>
                      </div>
                    </div>
                    {report.metric && (
                      <div className="flex flex-wrap gap-2.5 mt-3">
                        {report.metric.blood_sugar && (
                          <span className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-100 rounded-lg text-text-secondary">
                            Đường huyết: <strong className="text-text-primary">{report.metric.blood_sugar} mg/dL</strong>
                          </span>
                        )}
                        {report.metric.systolic && (
                          <span className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-100 rounded-lg text-text-secondary">
                            Huyết áp: <strong className="text-text-primary">{report.metric.systolic}/{report.metric.diastolic} mmHg</strong>
                          </span>
                        )}
                        {report.metric.heart_rate && (
                          <span className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-100 rounded-lg text-text-secondary">
                            Nhịp tim: <strong className="text-text-primary">{report.metric.heart_rate} bpm</strong>
                          </span>
                        )}
                        {report.metric.bmi && (
                          <span className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-100 rounded-lg text-text-secondary">
                            BMI: <strong className="text-text-primary">{report.metric.bmi}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-text-secondary flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}