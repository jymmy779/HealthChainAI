'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Profile, HealthRecord, AccessPermission } from '@/lib/types';

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

function DoctorAIChatContent() {
  const { profile: doctorProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const recordIdParam = searchParams.get('recordId');

  // Patients & Records lists
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientRecords, setPatientRecords] = useState<HealthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Selected values
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('profile');

  // Chat conversation
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Auth checking
  useEffect(() => {
    if (!authLoading && doctorProfile?.role !== 'doctor') {
      router.push('/dashboard');
    }
  }, [authLoading, doctorProfile, router]);

  // Fetch doctors patients (permissions list)
  useEffect(() => {
    if (doctorProfile?.role === 'doctor') {
      setLoadingPatients(true);
      fetch('/api/doctor/patients')
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Không thể lấy danh sách bệnh nhân.');
        })
        .then((data) => {
          const validPermissions = Array.isArray(data) ? data : [];
          setPermissions(validPermissions);
          
          if (patientIdParam && validPermissions.some(p => p.patient_id === patientIdParam)) {
            setSelectedPatientId(patientIdParam);
          } else if (validPermissions.length > 0 && validPermissions[0].patient_id) {
            setSelectedPatientId(validPermissions[0].patient_id);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingPatients(false));
    }
  }, [doctorProfile, patientIdParam]);

  // Fetch records for the selected patient
  useEffect(() => {
    if (doctorProfile?.role === 'doctor' && selectedPatientId) {
      setLoadingRecords(true);
      setPatientRecords([]);
      setSelectedRecordId('profile');
      setMessages([]);
      setQuery('');
      
      fetch(`/api/doctor/patients/${selectedPatientId}/records`)
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data) => {
          const recs = Array.isArray(data) ? data : [];
          setPatientRecords(recs);
          
          if (recordIdParam && recs.some(r => r.id === recordIdParam)) {
            setSelectedRecordId(recordIdParam);
          } else {
            setSelectedRecordId('profile');
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingRecords(false));
    }
  }, [doctorProfile, selectedPatientId, recordIdParam]);

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value);
  };

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
    if (!messageText.trim() || sending || !selectedPatientId) return;

    const newUserMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setQuery('');
    setSending(true);

    try {
      // Endpoint logic:
      // If 'profile', calls patient general profile chat: `/api/records/patient/{patient_id}/chat`
      // Else calls record chat: `/api/records/{record_id}/chat`
      const endpoint = selectedRecordId === 'profile'
        ? `/api/records/patient/${selectedPatientId}/chat`
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

  if (authLoading || loadingPatients) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang thiết lập danh sách bệnh nhân...</p>
        </div>
      </div>
    );
  }

  const selectedPatient = permissions.find(p => p.patient_id === selectedPatientId)?.patient;
  const selectedRecord = patientRecords.find(r => r.id === selectedRecordId);

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
      {/* Header with selection selectors */}
      <div className="p-4 border-b border-border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-text-primary flex items-center gap-1.5">
            🩺 AI Tham vấn Lâm sàng chuyên sâu
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">Trò chuyện y khoa hỗ trợ chẩn đoán cho Bác sĩ</p>
        </div>

        {/* Dropdown selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Patient Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider shrink-0">Bệnh nhân:</label>
            <select
              value={selectedPatientId}
              onChange={handlePatientChange}
              className="text-xs font-semibold px-2 py-1.5 bg-white border border-border rounded-xl focus:border-primary outline-none cursor-pointer text-text-primary"
            >
              {permissions.length === 0 ? (
                <option value="">Không có bệnh nhân</option>
              ) : (
                permissions.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    👤 {p.patient?.full_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Record Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider shrink-0">Bệnh án:</label>
            <select
              value={selectedRecordId}
              onChange={handleRecordChange}
              disabled={loadingRecords || !selectedPatientId}
              className="text-xs font-semibold px-2 py-1.5 bg-white border border-border rounded-xl focus:border-primary outline-none cursor-pointer text-text-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="profile">📋 Sức khỏe tổng quát (Tiền sử)</option>
              {patientRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  📄 {r.name.length > 25 ? `${r.name.substring(0, 25)}...` : r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
        {!selectedPatientId ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary">
            <p className="text-sm font-semibold">Chưa có bệnh nhân nào cấp quyền truy cập cho bạn.</p>
            <p className="text-xs mt-1">Các bệnh nhân cần chia sẻ hồ sơ thì tên của họ mới xuất hiện tại đây.</p>
          </div>
        ) : loadingRecords ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 bg-secondary-light/60 text-secondary rounded-2xl flex items-center justify-center animate-pulse-soft">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="max-w-md">
              <h2 className="text-base font-bold text-text-primary">
                {selectedRecordId === 'profile' ? `Chẩn đoán lâm sàng chung: ${selectedPatient?.full_name}` : `Đánh giá bệnh án: ${selectedRecord?.name}`}
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Nhập câu hỏi thảo luận y tế của bạn hoặc chọn các chẩn đoán nhanh từ AI:
              </p>
            </div>
            <div className="w-full max-w-lg grid gap-2">
              {selectedRecordId === 'profile' ? (
                <>
                  <button
                    onClick={() => handleSendMessage("Hãy đánh giá nhanh thể trạng của bệnh nhân này qua chỉ số BMI, nhóm máu và bệnh sử mãn tính.")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>🩺</span> Đánh giá thể trạng lâm sàng & tiền sử
                  </button>
                  <button
                    onClick={() => handleSendMessage("Có bất cứ điểm bất tương thích hoặc tương tác dị ứng nào cần đề phòng trong phác đồ điều trị cho bệnh nhân này?")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>⚠️</span> Các cảnh báo dị ứng hoặc tiền sử đặc biệt
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendMessage("Hãy tóm tắt toàn bộ phát hiện lâm sàng và cận lâm sàng chính trong hồ sơ này.")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>📝</span> Tóm tắt phát hiện lâm sàng
                  </button>
                  <button
                    onClick={() => handleSendMessage("Đánh giá xem có chỉ số sinh hóa máu/nước tiểu nào ngoài phạm vi bình thường (out of range)?")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>🧪</span> Phát hiện chỉ số sinh hóa ngoài ngưỡng
                  </button>
                  <button
                    onClick={() => handleSendMessage("Gợi ý các bước chẩn đoán phân biệt tiếp theo hoặc đơn thuốc khuyến nghị cho ca này.")}
                    className="w-full p-3 bg-white border border-border rounded-xl text-xs text-text-primary hover:bg-gray-50 hover:border-gray-300 font-semibold text-left flex items-center gap-2.5 shadow-sm transition-all"
                  >
                    <span>🔍</span> Đề xuất hướng xử trí & chẩn đoán phân biệt
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
                  {msg.role === 'user' ? 'BS' : 'AI'}
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

      {/* Input */}
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
          disabled={sending || !selectedPatientId}
          placeholder="Nhập câu hỏi lâm sàng thảo luận với AI y khoa..."
          className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-border focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm text-text-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={sending || !query.trim() || !selectedPatientId}
          className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Gửi tham vấn
        </button>
      </div>
    </div>
  );
}

export default function DoctorUnifiedAIChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary font-medium">Đang thiết lập danh sách bệnh nhân...</p>
        </div>
      </div>
    }>
      <DoctorAIChatContent />
    </Suspense>
  );
}
