'use client';

import { useState } from 'react';
import { useAccessPermissions, useDoctors, useHealthRecords } from '@/hooks/useData';

export default function AccessPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: doctors, loading: loadingDoctors } = useDoctors();
  const { data: records } = useHealthRecords();
  const { data: permissions, loading, revoke, grant } = useAccessPermissions();

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [duration, setDuration] = useState('30');
  const [accessLevel, setAccessLevel] = useState<'all' | 'limited'>('all');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activePermissions = permissions.filter(p => p.status === 'active');

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError('Vui lòng chọn bác sĩ');
      return;
    }
    if (accessLevel === 'limited' && selectedRecords.length === 0) {
      setError('Vui lòng chọn ít nhất 1 hồ sơ');
      return;
    }

    setSubmitting(true);
    setError('');

    // Calculate expiry date
    let expiryDate = '';
    const days = parseInt(duration);
    if (days === 0) {
      // Permanent (100 years)
      const d = new Date();
      d.setFullYear(d.getFullYear() + 100);
      expiryDate = d.toISOString().split('T')[0];
    } else {
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiryDate = d.toISOString().split('T')[0];
    }

    const { error: grantError } = await grant(
      selectedDoctorId,
      expiryDate,
      accessLevel,
      accessLevel === 'limited' ? selectedRecords : undefined
    );

    setSubmitting(false);

    if (grantError) {
      setError(grantError);
    } else {
      setShowForm(false);
      setSelectedDoctorId('');
      setDuration('30');
      setAccessLevel('all');
      setSelectedRecords([]);
    }
  };

  const handleRecordToggle = (id: string) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Quản lý quyền truy cập</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">
          {showForm ? 'Hủy' : '+ Cấp quyền mới'}
        </button>
      </div>

      {/* Grant Access Form */}
      {showForm && (
        <form onSubmit={handleGrant} className="bg-white rounded-2xl p-5 shadow-sm border border-primary space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Cấp quyền cho bác sĩ</h2>
          
          {error && (
            <div className="p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Bác sĩ</label>
              {loadingDoctors ? (
                <div className="py-2 text-sm text-text-secondary">Đang tải danh sách bác sĩ...</div>
              ) : (
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary"
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.full_name} ({doc.specialty || 'Chuyên khoa'} - {doc.hospital || 'Bệnh viện'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Thời hạn</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base text-text-primary"
              >
                <option value="7">7 ngày</option>
                <option value="30">30 ngày</option>
                <option value="90">90 ngày</option>
                <option value="0">Vĩnh viễn</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={accessLevel === 'all'}
                  onChange={(e) => setAccessLevel(e.target.checked ? 'all' : 'limited')}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-primary font-medium">Cho phép xem tất cả hồ sơ</span>
              </label>

              {accessLevel === 'limited' && (
                <div className="pl-7 space-y-2">
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Chọn hồ sơ được phép truy cập</label>
                  {records.length === 0 ? (
                    <p className="text-sm text-text-secondary">Bạn chưa có hồ sơ nào để chia sẻ</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-3 space-y-2 bg-gray-50">
                      {records.map(record => (
                        <label key={record.id} className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={() => handleRecordToggle(record.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-text-primary truncate">{record.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-gray-100 text-text-primary rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {submitting ? 'Đang cấp quyền...' : 'Cấp quyền ngay'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Authorized Doctors List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
          {activePermissions.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
                  {doc.doctor?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{doc.doctor?.full_name}</p>
                  <p className="text-sm text-text-secondary">{doc.doctor?.hospital}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">
                  Hết hạn: {new Date(doc.expiry_date).getFullYear() > 2100 ? 'Vĩnh viễn' : new Date(doc.expiry_date).toLocaleDateString('vi-VN')}
                </p>
                <button onClick={() => revoke(doc.id)} className="text-danger text-xs font-medium hover:underline">Thu hồi</button>
              </div>
            </div>
          ))}
          {activePermissions.length === 0 && (
            <div className="p-8 text-center text-text-secondary">Không có quyền truy cập nào đang hoạt động</div>
          )}
        </div>
      )}
    </div>
  );
}