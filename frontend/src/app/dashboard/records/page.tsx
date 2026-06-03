'use client';

import { useState } from 'react';
import { healthRecords, healthRecordTypes } from '@/data/mockData';
import Link from 'next/link';

export default function RecordsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const records = healthRecords;

  const filteredRecords = records.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getIconBg = (type: string) => {
    if (type === 'xet-nghiem-mau') return 'bg-danger-light';
    if (type === 'don-thuoc') return 'bg-warning-light';
    if (type === 'hinh-anh') return 'bg-primary-light';
    return 'bg-primary-light';
  };

  const getIconColor = (type: string) => {
    if (type === 'xet-nghiem-mau') return 'text-danger';
    if (type === 'don-thuoc') return 'text-warning';
    if (type === 'hinh-anh') return 'text-primary';
    return 'text-primary';
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Hồ sơ sức khỏe</h1>
        <Link href="/dashboard/records/upload" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">
          + Upload mới
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm hồ sơ..." className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 bg-white rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary">
          <option value="all">Tất cả</option>
          {healthRecordTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
        {filteredRecords.map((record) => (
          <Link key={record.id} href={`/dashboard/records/${record.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(record.type)}`}>
              <svg className={`w-6 h-6 ${getIconColor(record.type)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary truncate">{record.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-text-secondary">{record.date}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary">{record.typeLabel}</span>
              </div>
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
        {filteredRecords.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-text-secondary">Không tìm thấy hồ sơ nào</p>
          </div>
        )}
      </div>
    </div>
  );
}