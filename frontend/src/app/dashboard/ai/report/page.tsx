'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { aiAnalysisResults } from '@/data/mockData';

function AIReportContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (reportId) {
        const found = aiAnalysisResults.history.find(h => h.id === reportId);
        setReport(found || aiAnalysisResults.current);
      } else {
        setReport(aiAnalysisResults.current);
      }
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [reportId]);

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return { text: 'text-danger', bg: 'bg-danger-light', border: 'border-danger', bar: '#F44336' };
    if (risk >= 50) return { text: 'text-warning', bg: 'bg-warning-light', border: 'border-warning', bar: '#FF9800' };
    return { text: 'text-secondary', bg: 'bg-secondary-light', border: 'border-secondary', bar: '#4CAF50' };
  };

  const getOverallRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return { label: 'Cao', color: 'text-danger', bg: 'bg-danger-light' };
      case 'medium': return { label: 'Trung bình', color: 'text-warning', bg: 'bg-warning-light' };
      case 'low': return { label: 'Thấp', color: 'text-secondary', bg: 'bg-secondary-light' };
      default: return { label: 'Không xác định', color: 'text-text-secondary', bg: 'bg-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2" />
          <div className="h-5 w-96 bg-gray-100 rounded-lg mb-8" />
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 animate-fadeIn">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Không tìm thấy báo cáo</h2>
        <Link href="/dashboard/ai" className="text-primary font-semibold hover:underline">Quay lại phân tích AI</Link>
      </div>
    );
  }

  const overallRisk = getOverallRiskLabel(report.overallRisk || 'medium');

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <Link href="/dashboard/ai" className="hover:text-primary">AI</Link>
          <span>/</span>
          <span className="text-text-primary font-medium">Báo cáo chi tiết</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Báo cáo phân tích chi tiết</h1>
            <p className="text-text-secondary mt-1">{report.date || 'Phân tích mới nhất'}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-base font-bold ${overallRisk.bg} ${overallRisk.color}`}>
            Nguy cơ {overallRisk.label}
          </div>
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-primary font-medium">{report.summary}</p>
          </div>
        </div>
      )}

      {/* Disease Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(report.diseases || aiAnalysisResults.current.diseases).map((disease: any, index: number) => {
          const riskColor = getRiskColor(disease.risk);
          return (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border-l-4 transition-all hover:shadow-md"
              style={{ borderColor: riskColor.bar }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-text-primary text-base">{disease.name}</h3>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${riskColor.bg}`}>
                  <svg className={`w-5 h-5 ${riskColor.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Nguy cơ</span>
                  <span className={`font-bold ${riskColor.text}`}>{disease.risk}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${disease.risk}%`, backgroundColor: riskColor.bar }} />
                </div>
              </div>
              <p className="text-sm text-text-secondary">{disease.description}</p>
              {disease.recommendations && disease.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-text-primary mb-2">Khuyến nghị:</p>
                  <ul className="space-y-1">
                    {disease.recommendations.slice(0, 2).map((rec: any, i: number) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History Trend */}
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Xu hướng nguy cơ qua các tháng</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Thời gian</th>
                {aiAnalysisResults.current.diseases.map((d, i) => (
                  <th key={i} className="text-center py-3 px-4 text-sm font-semibold text-text-secondary">{d.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...aiAnalysisResults.history].reverse().map((item, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">{item.date}</td>
                  {item.diseases.map((d, i) => (
                    <td key={i} className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        d.risk >= 70 ? 'bg-danger-light text-danger' :
                        d.risk >= 50 ? 'bg-warning-light text-warning' : 'bg-secondary-light text-secondary'
                      }`}>
                        {d.risk}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/ai" className="flex-1 py-3.5 bg-gray-100 text-text-primary rounded-2xl font-semibold text-base text-center hover:bg-gray-200 transition-all">
          Quay lại
        </Link>
        <button className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-semibold text-base hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Tải báo cáo PDF
        </button>
        <button className="flex-1 py-3.5 bg-gradient-to-r from-secondary to-green-600 text-white rounded-2xl font-semibold text-base hover:shadow-lg hover:shadow-secondary/25 transition-all flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Lưu kết quả vào hồ sơ
        </button>
      </div>
    </div>
  );
}

export default function AIReportPage() {
  return (
    <Suspense fallback={
      <div className="animate-fadeIn space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2" />
          <div className="h-5 w-96 bg-gray-100 rounded-lg mb-8" />
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    }>
      <AIReportContent />
    </Suspense>
  );
}