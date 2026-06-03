'use client';

import { useState } from 'react';
import { currentUser, aiAnalysisResults } from '@/data/mockData';
import Link from 'next/link';

export default function AIPage() {
  const user = currentUser;
  const currentAnalysis = aiAnalysisResults.current;
  const predictions = currentAnalysis?.diseases?.map(d => ({
    disease: d.name,
    risk: d.risk,
    description: d.description,
    lastUpdate: currentAnalysis.date || '03/06/2026',
    recommendations: d.recommendations || []
  })) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold text-text-primary">Phân tích sức khỏe thông minh</h1>

      {/* Risk Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predictions.map((p, i) => (
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

      {/* Detailed Analysis Button */}
      <Link href="/dashboard/ai/report" className="block w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-semibold text-base text-center hover:shadow-lg hover:shadow-primary/25 transition-all">
        Xem báo cáo phân tích chi tiết
      </Link>

      {/* AI History */}
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Lịch sử phân tích</h2>
          <Link href="/dashboard/ai/history" className="text-primary text-sm font-semibold hover:underline">Xem tất cả</Link>
        </div>
        <div className="space-y-3">
          {(aiAnalysisResults?.history || []).slice(0, 3).map((item, i) => (
            <Link key={i} href={`/dashboard/ai/report?id=${item.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
              <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">{item.date || `Phân tích tháng ${i + 1}`}</p>
                <p className="text-sm text-text-secondary">Đã hoàn thành • {item.diseases?.length || 3} nguy cơ được phát hiện</p>
              </div>
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}