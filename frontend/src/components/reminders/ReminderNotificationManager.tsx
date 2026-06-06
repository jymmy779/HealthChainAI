'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string;
  time: string; // HH:MM
  date?: string | null; // YYYY-MM-DD
  is_active: boolean;
  last_notified?: string | null;
  created_at: string;
}

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'medication':
      return {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        label: 'Uống thuốc',
        iconColor: 'text-blue-500',
        badgeBg: 'bg-blue-100',
      };
    case 'checkup':
      return {
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-800',
        label: 'Kiểm tra sức khỏe',
        iconColor: 'text-emerald-500',
        badgeBg: 'bg-emerald-100',
      };
    case 'appointment':
      return {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-800',
        label: 'Lịch hẹn bác sĩ',
        iconColor: 'text-amber-500',
        badgeBg: 'bg-amber-100',
      };
    case 'exercise':
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        label: 'Tập luyện',
        iconColor: 'text-red-500',
        badgeBg: 'bg-red-100',
      };
    default:
      return {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-800',
        label: 'Nhắc nhở khác',
        iconColor: 'text-gray-500',
        badgeBg: 'bg-gray-100',
      };
  }
};

export default function ReminderNotificationManager() {
  const { profile } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [activeToasts, setActiveToasts] = useState<Reminder[]>([]);
  const notifiedMap = useRef<{ [key: string]: string }>({}); // reminderId -> lastNotifiedMinuteStr

  // Phát âm thanh chuông báo điện tử dễ chịu bằng Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Âm thứ nhất (Nốt D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      // Âm thứ hai (Nốt A5) trễ 80ms tạo hợp âm chime dễ chịu
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 80);
    } catch (e) {
      console.error('Không thể phát âm thanh thông báo:', e);
    }
  }, []);

  // Kiểm tra quyền trên trình duyệt sau khi client hydrate
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      const isDismissed = sessionStorage.getItem('dismissed_notif_banner');
      if (Notification.permission === 'default' && !isDismissed) {
        setShowBanner(true);
      }
    }
  }, []);

  // Yêu cầu quyền thông báo
  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setShowBanner(false);
        playNotificationSound();
        new Notification('HealthChain AI', {
          body: 'Đã kích hoạt thông báo nhắc nhở sức khỏe thành công! 🔔',
          icon: '/globe.svg',
        });
      }
    } catch (e) {
      console.error('Lỗi khi xin quyền thông báo:', e);
    }
  };

  // Tắt banner tạm thời trong phiên làm việc
  const dismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem('dismissed_notif_banner', 'true');
  };

  // Logic kiểm tra và kích hoạt thông báo nhắc nhở
  const checkReminders = useCallback(async () => {
    // Chỉ kích hoạt cho bệnh nhân
    if (!profile || profile.role !== 'patient') return;

    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) return;

      const reminders: Reminder[] = await res.json();
      const activeReminders = reminders.filter((r) => r.is_active);

      const now = new Date();
      // Lấy chuỗi định dạng YYYY-MM-DD theo giờ địa phương
      const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      // Lấy chuỗi giờ HH:MM theo giờ địa phương
      const localTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentMinStr = `${localDateStr} ${localTimeStr}`;

      activeReminders.forEach((reminder) => {
        // Kiểm tra xem nhắc nhở có khớp ngày (nếu có) và giờ hiện tại không
        const isDateMatch = !reminder.date || reminder.date === localDateStr;
        const isTimeMatch = reminder.time === localTimeStr;

        if (isDateMatch && isTimeMatch) {
          // Tránh gửi lặp lại nhiều lần trong cùng 1 phút
          if (notifiedMap.current[reminder.id] !== currentMinStr) {
            notifiedMap.current[reminder.id] = currentMinStr;

            // Kích hoạt chuông và giao diện
            playNotificationSound();
            setActiveToasts((prev) => {
              // Tránh thêm trùng vào danh sách Toasts đang hiển thị
              if (prev.some((t) => t.id === reminder.id)) return prev;
              return [...prev, reminder];
            });

            // Gửi thông báo hệ thống nếu có quyền
            if (permission === 'granted') {
              const typeStyle = getTypeStyle(reminder.type);
              new Notification(`HealthChain AI: ${typeStyle.label}`, {
                body: `${reminder.title}${reminder.description ? ` - ${reminder.description}` : ''}`,
                icon: '/globe.svg',
                tag: reminder.id, // Nhóm các thông báo của cùng reminder
              });
            }

            // Ghi nhận lịch sử đã báo lên Server (PUT)
            fetch(`/api/reminders/${reminder.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ last_notified: new Date().toISOString() }),
            }).catch((err) => console.error('Lỗi lưu lịch sử thông báo lên server:', err));
          }
        }
      });
    } catch (err) {
      console.error('Lỗi kiểm tra nhắc nhở ngầm:', err);
    }
  }, [profile, permission, playNotificationSound]);

  // Thiết lập interval quét nhắc nhở định kỳ mỗi 20 giây
  useEffect(() => {
    if (!profile || profile.role !== 'patient') return;

    // Chạy kiểm tra ngay khi load
    checkReminders();

    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [profile, checkReminders]);

  // Hủy bỏ nhắc nhở (đánh dấu hoàn thành)
  const handleCompleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });
      if (res.ok) {
        // Xóa khỏi danh sách toasts hiển thị
        setActiveToasts((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error('Lỗi khi đánh dấu hoàn thành nhắc nhở:', e);
    }
  };

  // Đóng Toast in-app
  const closeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Không hiển thị gì nếu là Bác sĩ hoặc chưa đăng nhập
  if (!profile || profile.role !== 'patient') return null;

  return (
    <>
      {/* Banner xin quyền thông báo ở trên cùng Dashboard */}
      {showBanner && (
        <div className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0 animate-bounce">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm sm:text-base">Bật thông báo đẩy trình duyệt</p>
              <p className="text-xs text-text-secondary mt-0.5">Cho phép chúng tôi gửi thông báo uống thuốc, rèn luyện sức khỏe ngay cả khi bạn đóng ứng dụng.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
            >
              Kích hoạt
            </button>
            <button
              onClick={dismissBanner}
              className="px-3 py-2 bg-gray-100 text-text-secondary rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Danh sách Toast Alerts nổi bên góc dưới phải */}
      {activeToasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0">
          {activeToasts.map((toast) => {
            const style = getTypeStyle(toast.type);
            return (
              <div
                key={toast.id}
                className={`bg-white rounded-2xl shadow-xl border-l-4 p-4 flex gap-3 animate-slideUp transition-all hover:scale-[1.02] ${style.bg}`}
                style={{ borderLeftColor: toast.type === 'medication' ? '#3B82F6' : toast.type === 'checkup' ? '#10B981' : toast.type === 'appointment' ? '#F59E0B' : '#EF4444' }}
              >
                {/* Icon loại nhắc nhở */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.badgeBg} ${style.iconColor}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {toast.type === 'medication' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ) : toast.type === 'checkup' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    ) : toast.type === 'appointment' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    )}
                  </svg>
                </div>

                {/* Nội dung thông báo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-text-primary text-sm sm:text-base leading-tight truncate">{toast.title}</p>
                    <button
                      onClick={() => closeToast(toast.id)}
                      className="text-text-secondary hover:text-text-primary p-0.5 rounded-lg hover:bg-black/5 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary font-medium mt-0.5">{style.label} • Lúc {toast.time}</p>
                  {toast.description && (
                    <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 bg-white/40 rounded-lg p-1.5 border border-black/5">{toast.description}</p>
                  )}

                  {/* Actions buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleCompleteReminder(toast.id)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Đã xong
                    </button>
                    <button
                      onClick={() => closeToast(toast.id)}
                      className="px-3 py-1.5 bg-black/5 text-text-secondary rounded-lg text-xs font-semibold hover:bg-black/10 transition-all cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
