'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { currentUser, healthMetrics, healthRecords } from '@/data/mockData';
import Link from 'next/link';

export default function DashboardPage() {
  const user = currentUser;
  const latestMetrics = healthMetrics[healthMetrics.length - 1];
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  });

  const quickCards = [
    { label: 'BMI', value: user.bmi || '25.5', unit: '', status: 'Bình thường', color: 'text-secondary', bg: 'bg-secondary-light/30' },
    { label: 'Huyết áp', value: latestMetrics ? `${latestMetrics.systolic}/${latestMetrics.diastolic}` : '128/85', unit: 'mmHg', status: 'Cảnh báo nhẹ', color: 'text-warning', bg: 'bg-warning-light/30' },
    { label: 'Đường huyết', value: latestMetrics ? latestMetrics.bloodSugar : '5.5', unit: 'mmol/L', status: 'Ổn định', color: 'text-secondary', bg: 'bg-secondary-light/30' },
    { label: 'Nhịp tim', value: latestMetrics ? latestMetrics.heartRate : '76', unit: 'bpm', status: 'Bình thường', color: 'text-primary', bg: 'bg-primary-light/30' },
  ];

  // Transform healthMetrics for the chart
  const chartData = healthMetrics.map(m => ({
    day: new Date(m.date).getDate().toString(),
    bloodPressure: m.systolic,
    bloodSugar: m.bloodSugar,
    heartRate: m.heartRate,
  }));

  const recentRecords = [...healthRecords].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  const getRecordIcon = (type: string) => {
    if (type === 'xet-nghiem-mau') return 'blood';
    if (type === 'don-thuoc') return 'prescription';
    if (type === 'hinh-anh') return 'image';
    return 'report';
  };

  const getIconBg = (type: string) => {
    if (type === 'xet-nghiem-mau') return 'bg-danger-light';
    if (type === 'don-thuoc') return 'bg-warning-light';
    return 'bg-primary-light';
  };

  const getIconColor = (type: string) => {
    if (type === 'xet-nghiem-mau') return 'text-danger';
    if (type === 'don-thuoc') return 'text-warning';
    return 'text-primary';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, {user.name.split(' ').pop()}! 👋
          </h1>
          <p className="text-text-secondary mt-1">
            Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Health Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickCards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-2xl p-4 lg:p-5 transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-secondary">{card.label}</span>
              <svg className={`w-5 h-5 ${card.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {card.value} <span className="text-sm font-normal text-text-secondary">{card.unit}</span>
            </div>
            <div className={`text-sm font-medium mt-1 ${card.color}`}>{card.status}</div>
          </div>
        ))}
      </div>

      {/* Health Trend Chart */}
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Xu hướng sức khỏe 30 ngày qua</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} tickMargin={8} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickMargin={8} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="bloodPressure" name="Huyết áp" stroke="#1E88E5" strokeWidth={2} dot={{ fill: '#1E88E5', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="bloodSugar" name="Đường huyết" stroke="#4CAF50" strokeWidth={2} dot={{ fill: '#4CAF50', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="heartRate" name="Nhịp tim" stroke="#FF9800" strokeWidth={2} dot={{ fill: '#FF9800', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions + AI Today */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upload Button */}
        <Link href="/dashboard/records/upload" className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg shadow-primary/25 block hover:shadow-xl hover:shadow-primary/30 transition-all">
          <h3 className="text-xl font-bold">Upload hồ sơ mới</h3>
          <p className="text-primary-light mt-2 text-base">Lưu trữ kết quả khám bệnh, đơn thuốc lên Blockchain an toàn</p>
          <div className="mt-4 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold text-base hover:bg-white/30 transition-all inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Chọn file
          </div>
        </Link>

        {/* AI Today */}
        <Link href="/dashboard/ai" className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border-l-4 border-warning block hover:shadow-md transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-warning-light rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">AI Khuyến nghị hôm nay</h3>
              <p className="text-text-secondary mt-2 text-base">
                Dựa trên dữ liệu sức khỏe gần đây, AI phát hiện chỉ số huyết áp của bạn có xu hướng tăng nhẹ. 
                Nên đo huyết áp thường xuyên và hạn chế muối trong bữa ăn.
              </p>
              <span className="mt-3 text-primary font-semibold hover:underline text-base inline-flex items-center gap-1">
                Xem phân tích chi tiết
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Hồ sơ gần đây</h2>
          <Link href="/dashboard/records" className="text-primary font-semibold text-sm hover:underline">Xem tất cả</Link>
        </div>
        <div className="space-y-3">
          {recentRecords.map((record) => (
            <Link key={record.id} href={`/dashboard/records/${record.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(record.type)}`}>
                <svg className={`w-5 h-5 ${getIconColor(record.type)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {record.type === 'xet-nghiem-mau' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  ) : record.type === 'don-thuoc' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  )}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary truncate">{record.name}</p>
                <p className="text-sm text-text-secondary">{record.date}</p>
              </div>
              <div className="text-right">
                <div className="text-xs px-2 py-1 rounded-full bg-secondary-light/50 text-secondary font-medium">
                  {record.blockchainStatus === 'confirmed' ? 'Đã lưu Blockchain' : 'Đang xử lý'}
                </div>
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