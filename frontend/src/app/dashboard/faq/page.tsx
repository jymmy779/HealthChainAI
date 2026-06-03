'use client';

import { useState } from 'react';
import { faqItems } from '@/data/mockData';

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Câu hỏi thường gặp (FAQ)</h1>
        <p className="text-text-secondary mt-1">Giải đáp thắc mắc về HealthChain AI</p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm câu hỏi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-2 border-border focus:border-primary outline-none text-base transition-all"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-text-secondary font-medium">Không tìm thấy kết quả</p>
            <p className="text-sm text-text-secondary mt-1">Thử tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <button
                onClick={() => toggleFaq(item.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-base font-semibold text-text-primary pr-4">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-text-secondary flex-shrink-0 transition-transform duration-300 ${openId === item.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openId === item.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-5 pb-5 text-text-secondary leading-relaxed border-t border-border pt-4">
                  {item.answer}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white text-center">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold mb-2">Chưa tìm thấy câu trả lời?</h3>
        <p className="text-white/80 text-sm mb-4">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp đỡ bạn</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-6 py-3 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all">
            Gửi yêu cầu hỗ trợ
          </button>
          <button className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-all">
            Gọi hotline: 1900 xxxx
          </button>
        </div>
      </div>
    </div>
  );
}