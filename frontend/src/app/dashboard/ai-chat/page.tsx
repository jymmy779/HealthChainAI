'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useHealthRecords } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';

// Helper functions to parse and format basic markdown
function parseItalics(text: string): React.ReactNode[] {
  const italicRegex = /\*(.*?)\*/g;
  const rawParts = text.split(italicRegex);
  return rawParts.map((part, i) => {
    if (i % 2 === 1) {
      return <em key={i} className="italic">{part}</em>;
    }
    return part;
  });
}

function parseInlineStyles(text: string): React.ReactNode[] {
  const tokenRegex = /(\*\*.*?\*\*)/g;
  const rawParts = text.split(tokenRegex);
  
  return rawParts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const innerText = part.slice(2, -2);
      return <strong key={i} className="font-bold text-text-primary">{parseItalics(innerText)}</strong>;
    }
    return parseItalics(part);
  });
}

function formatMessageText(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  
  return lines.map((line, index) => {
    // Check if bullet point starting with "- " or "* "
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length * 4;
      return (
        <div key={index} className="flex items-start gap-2 py-0.5" style={{ paddingLeft: `${indent}px` }}>
          <span className="text-primary mt-1.5 shrink-0 block w-1.5 h-1.5 bg-primary rounded-full" />
          <span className="flex-1">{parseInlineStyles(bulletMatch[2])}</span>
        </div>
      );
    }
    
    // Check if numbered list starting with "1. ", "2. "
    const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      const indent = numberMatch[1].length * 4;
      return (
        <div key={index} className="flex items-start gap-1.5 py-0.5" style={{ paddingLeft: `${indent}px` }}>
          <span className="text-primary font-bold text-xs shrink-0 mt-0.5">{numberMatch[2]}.</span>
          <span className="flex-1">{parseInlineStyles(numberMatch[3])}</span>
        </div>
      );
    }

    return (
      <p key={index} className={line.trim() === '' ? 'h-3' : 'min-h-[1.25rem]'}>
        {parseInlineStyles(line)}
      </p>
    );
  });
}

function AIChatContent() {
  const { profile } = useAuth();
  const { data: records, loading } = useHealthRecords();
  const searchParams = useSearchParams();
  const recordIdParam = searchParams.get('recordId') || 'profile';
  
  const [selectedRecordId, setSelectedRecordId] = useState<string>(recordIdParam);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (recordIdParam) {
      setSelectedRecordId(recordIdParam);
    }
  }, [recordIdParam]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Reset messages when focusing record changes
  const handleRecordChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRecordId(e.target.value);
    setMessages([]);
    setQuery('');
  };

  const handleEditMessage = (index: number) => {
    const msgToEdit = messages[index];
    setQuery(msgToEdit.content);
    setMessages(prev => prev.slice(0, index));
  };

  const latestUserMessageIndex = messages.reduce((lastIndex, msg, idx) => msg.role === 'user' ? idx : lastIndex, -1);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || query;
    if (!messageText.trim() || sending) return;

    const newUserMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setQuery('');
    setSending(true);

    try {
      // Determine the endpoint: if 'profile', chat about overall health profile, else chat about the specific record
      const endpoint = selectedRecordId === 'profile'
        ? '/api/records/profile/chat'
        : `/api/records/${selectedRecordId}/chat`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: messageText,
          history: messages
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant' as const, content: data.answer }]);
      } else {
        const errData = await res.json();
        setMessages(prev => [...prev, { role: 'assistant' as const, content: `Lỗi: ${errData.detail || 'Không thể nhận phản hồi.'}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant' as const, content: `Lỗi mạng: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang kết nối trợ lý AI...</p>
        </div>
      </div>
    );
  }

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="p-4 border-b border-border bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-text-primary flex items-center gap-1.5">
            💬 Trò chuyện với Trợ lý AI Y khoa
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Tư vấn sức khỏe tổng quát hoặc thảo luận chi tiết bệnh án</p>
        </div>
        
        {/* Record Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">Ngữ cảnh:</label>
          <select
            value={selectedRecordId}
            onChange={handleRecordChange}
            className="text-xs font-semibold px-3 py-2 bg-white border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer text-text-primary"
          >
            <option value="profile">🩺 Sức khỏe tổng quát (Cá nhân)</option>
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                📄 {r.name.length > 30 ? `${r.name.substring(0, 30)}...` : r.name} ({r.type_label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 bg-primary-light text-primary rounded-2xl flex items-center justify-center animate-pulse-soft">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="max-w-md">
              <h2 className="text-base font-bold text-text-primary">
                {selectedRecordId === 'profile' ? 'Tư vấn sức khỏe cá nhân của bạn' : `Hỏi đáp về bệnh án: ${selectedRecord?.name}`}
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Hãy gửi một câu hỏi tự do hoặc nhấn chọn một câu hỏi gợi ý nhanh dưới đây để AI hỗ trợ bạn:
              </p>
            </div>
            
            {/* Quick Suggestion Buttons based on context */}
            <div className="w-full max-w-lg grid gap-2">
              {selectedRecordId === 'profile' ? (
                <>
                  <button
                    onClick={() => handleSendMessage("Hãy đánh giá trạng thái cơ thể của tôi dựa trên chiều cao, cân nặng (BMI) và nhóm máu.")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>🩺</span> Đánh giá chỉ số cơ thể & nhóm máu
                  </button>
                  <button
                    onClick={() => handleSendMessage("Tôi có tiền sử dị ứng hoặc bệnh mãn tính gì cần chú ý đặc biệt không?")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>⚠️</span> Lưu ý về dị ứng & bệnh mãn tính của tôi
                  </button>
                  <button
                    onClick={() => handleSendMessage("Đề xuất chế độ ăn uống, tập luyện chung giúp tôi duy trì sức khỏe tối ưu hàng ngày.")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>🥗</span> Đề xuất thói quen & chế độ dinh dưỡng hàng ngày
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendMessage("Hãy tóm tắt hồ sơ bệnh án này cho tôi một cách ngắn gọn, dễ hiểu nhất.")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>📝</span> Tóm tắt bệnh án này
                  </button>
                  <button
                    onClick={() => handleSendMessage("Kiểm tra xem các chỉ số sức khỏe của tôi trong tài liệu này có gì bất thường không và giải thích ý nghĩa?")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>📈</span> Phát hiện chỉ số bất thường & giải thích
                  </button>
                  <button
                    onClick={() => handleSendMessage("Dựa trên hồ sơ bệnh án này, tôi nên lưu ý những gì về lối sống và sử dụng thuốc?")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>💊</span> Lưu ý sử dụng thuốc & lối sống
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm ${
                  msg.role === 'user' ? 'bg-secondary text-white' : 'bg-primary-light text-primary'
                }`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                {/* Bubble */}
                <div className="flex flex-col items-end">
                  <div className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-secondary-light/30 border-secondary-light/60 text-text-primary rounded-tr-none'
                      : 'bg-white border-border text-text-primary rounded-tl-none'
                  }`}>
                    {formatMessageText(msg.content)}
                  </div>
                  {index === latestUserMessageIndex && !sending && (
                    <button
                      onClick={() => handleEditMessage(index)}
                      className="mt-1 mr-1 text-[10px] text-secondary hover:text-secondary-dark font-semibold flex items-center gap-1 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                      title="Sửa & Gửi lại tin nhắn này"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Hoàn tác & Sửa
                    </button>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-3.5 max-w-[85%] animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                  AI
                </div>
                <div className="bg-white border border-border text-text-secondary rounded-2xl rounded-tl-none p-3.5 text-sm flex items-center gap-1.5 shadow-sm">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-border bg-white flex gap-3 flex-shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          disabled={sending}
          placeholder={selectedRecordId === 'profile' ? "Hỏi bất cứ điều gì về sức khỏe cá nhân của bạn..." : "Hỏi bất cứ điều gì về hồ sơ này..."}
          className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-border focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-text-primary disabled:bg-gray-100"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={sending || !query.trim()}
          className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Gửi tin nhắn
        </button>
      </div>
    </div>
  );
}

export default function UnifiedAIChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang kết nối trợ lý AI...</p>
        </div>
      </div>
    }>
      <AIChatContent />
    </Suspense>
  );
}
