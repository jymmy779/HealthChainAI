'use client';

import { useState } from 'react';
import { useReminders } from '@/hooks/useData';

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'medication': return { bg: 'bg-primary-light', text: 'text-primary', label: 'Thuốc', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
    case 'checkup': return { bg: 'bg-secondary-light', text: 'text-secondary', label: 'Kiểm tra', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' };
    case 'appointment': return { bg: 'bg-warning-light', text: 'text-warning', label: 'Lịch hẹn', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' };
    case 'exercise': return { bg: 'bg-danger-light', text: 'text-danger', label: 'Tập luyện', icon: 'M13 10V3L4 14h7v7l9-11h-7z' };
    default: return { bg: 'bg-gray-100', text: 'text-text-secondary', label: 'Khác', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' };
  }
};

export default function RemindersPage() {
  const { data: reminderList, loading, add, update, remove } = useReminders();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: '',
    time: '',
    type: 'medication',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAddReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.time) {
      alert('Vui lòng điền đủ thông tin tiêu đề và giờ');
      return;
    }

    setSubmitting(true);
    const { error } = await add({
      title: newReminder.title.trim(),
      description: newReminder.note.trim() || null,
      type: newReminder.type,
      time: newReminder.time,
      date: newReminder.date || null,
      is_active: true,
      last_notified: null
    });
    setSubmitting(false);

    if (error) {
      alert(`Lỗi khi tạo nhắc nhở: ${error}`);
    } else {
      setShowAddModal(false);
      setNewReminder({ title: '', date: '', time: '', type: 'medication', note: '' });
    }
  };

  const toggleComplete = async (id: string, currentActive: boolean) => {
    await update(id, { is_active: !currentActive });
  };

  const deleteReminder = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa nhắc nhở này?')) {
      await remove(id);
    }
  };

  // active: is_active === true, completed: is_active === false
  const activeReminders = reminderList.filter(r => r.is_active);
  const completedReminders = reminderList.filter(r => !r.is_active);

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nhắc nhở sức khỏe</h1>
          <p className="text-text-secondary mt-1">Quản lý lịch uống thuốc, khám bệnh và tập luyện</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Thêm nhắc nhở
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Active Reminders */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Đang hoạt động ({activeReminders.length})
            </h2>
            <div className="space-y-3">
              {activeReminders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-text-secondary">Bạn chưa có nhắc nhở nào</p>
                </div>
              ) : (
                activeReminders.map((reminder) => {
                  const typeStyle = getTypeStyle(reminder.type);
                  return (
                    <div key={reminder.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleComplete(reminder.id, reminder.is_active)}
                          className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-base text-text-primary">{reminder.title}</h3>
                              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                                {typeStyle.label}
                              </span>
                            </div>
                            <button onClick={() => deleteReminder(reminder.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                              <svg className="w-4 h-4 text-text-secondary hover:text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            {reminder.date && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {reminder.date}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {reminder.time}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-text-secondary mt-2 bg-gray-50 rounded-lg p-2">{reminder.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">Đã hoàn thành ({completedReminders.length})</h2>
              <div className="space-y-3">
                {completedReminders.map((reminder) => {
                  const typeStyle = getTypeStyle(reminder.type);
                  return (
                    <div key={reminder.id} className="bg-white rounded-2xl p-4 shadow-sm opacity-70">
                      <div className="flex items-start gap-4">
                        <button onClick={() => toggleComplete(reminder.id, reminder.is_active)} className="w-6 h-6 rounded-full border-2 border-secondary bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary line-through opacity-60">{reminder.title}</h3>
                          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>{typeStyle.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slideUp p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">Thêm nhắc nhở mới</h3>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none"
                  placeholder="Ví dụ: Uống thuốc huyết áp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Ngày (tùy chọn)</label>
                  <input
                    type="date"
                    value={newReminder.date}
                    onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">Giờ</label>
                  <input
                    type="time"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Loại nhắc nhở</label>
                <select
                  value={newReminder.type}
                  onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none"
                >
                  <option value="medication">Thuốc</option>
                  <option value="checkup">Kiểm tra sức khỏe</option>
                  <option value="appointment">Lịch hẹn bác sĩ</option>
                  <option value="exercise">Tập luyện</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Ghi chú (tùy chọn)</label>
                <textarea
                  value={newReminder.note}
                  onChange={(e) => setNewReminder({ ...newReminder, note: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none resize-none"
                  rows={2}
                  placeholder="Thêm ghi chú..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-text-primary rounded-xl font-semibold hover:bg-gray-200 transition-all">
                  Hủy
                </button>
                <button
                  onClick={handleAddReminder}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang thêm...' : 'Thêm nhắc nhở'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}