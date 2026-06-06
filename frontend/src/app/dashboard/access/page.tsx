'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccessPermissions, useDoctors, useHealthRecords } from '@/hooks/useData';
import Link from 'next/link';

function AccessPageContent() {
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
  const [revokePermissionId, setRevokePermissionId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const searchParams = useSearchParams();
  const grantTo = searchParams.get('grantTo');

  // Sync query parameters with state
  useEffect(() => {
    if (grantTo) {
      setSelectedDoctorId(grantTo);
      setShowForm(true);
    }
  }, [grantTo]);

  const activePermissions = permissions.filter(p => p.status === 'active');

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError('Vui lòng chọn bác sĩ từ danh sách.');
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
      // Clean query parameter from URL without page reload
      window.history.replaceState({}, '', '/dashboard/access');
    }
  };

  const handleRecordToggle = (id: string) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  // Find info of the currently selected doctor
  const selectedDoctor = doctors.find(doc => doc.id === selectedDoctorId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Quản lý quyền truy cập</h1>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setSelectedDoctorId('');
              window.history.replaceState({}, '', '/dashboard/access');
            } else {
              setShowForm(true);
            }
          }}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all cursor-pointer"
        >
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
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Bác sĩ tiếp nhận quyền</label>
              
              {loadingDoctors ? (
                <div className="py-3 text-sm text-text-secondary flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Đang tải danh sách bác sĩ...
                </div>
              ) : selectedDoctor ? (
                /* Doctor Selected State Display */
                <div className="flex items-center justify-between p-4 bg-primary-light/10 border border-primary/20 rounded-xl animate-fadeIn">
                  <div className="flex items-center gap-3">
                    {selectedDoctor.avatar_url ? (
                      <img
                        src={selectedDoctor.avatar_url}
                        alt={selectedDoctor.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        {selectedDoctor.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{selectedDoctor.full_name}</p>
                      <p className="text-xs text-text-secondary">
                        {selectedDoctor.specialty || 'Chuyên khoa chưa cập nhật'} • {selectedDoctor.hospital || 'Bệnh viện chưa cập nhật'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/access/doctors"
                    className="px-3.5 py-1.5 bg-white border border-border text-primary hover:border-primary rounded-lg text-xs font-semibold transition-all shadow-sm"
                  >
                    Đổi bác sĩ
                  </Link>
                </div>
              ) : (
                /* Doctor Not Selected State Display */
                <Link
                  href="/dashboard/access/doctors"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-xl bg-gray-50 hover:bg-gray-100/50 transition-all text-center group cursor-pointer"
                >
                  <svg className="w-7 h-7 text-text-secondary group-hover:text-primary transition-colors mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-bold text-text-primary text-sm group-hover:text-primary transition-colors">
                    🔍 Bấm để chọn Bác sĩ từ danh sách...
                  </span>
                  <span className="text-xs text-text-secondary mt-1">
                    Xem đầy đủ thông tin chi tiết và chứng chỉ trước khi quyết định chọn bác sĩ
                  </span>
                </Link>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Thời hạn cấp quyền</label>
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
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accessLevel === 'all'}
                  onChange={(e) => setAccessLevel(e.target.checked ? 'all' : 'limited')}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
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
                        <label key={record.id} className="flex items-center gap-2 py-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={() => handleRecordToggle(record.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
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
                onClick={() => {
                  setShowForm(false);
                  setSelectedDoctorId('');
                  window.history.replaceState({}, '', '/dashboard/access');
                }}
                className="flex-1 py-3 bg-gray-100 text-text-primary rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer"
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
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-text-primary">Bác sĩ hiện tại có quyền truy cập</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-border divide-y divide-border overflow-hidden">
            {activePermissions.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  {doc.doctor?.avatar_url ? (
                    <img
                      src={doc.doctor.avatar_url}
                      alt={doc.doctor.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-border shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
                      {doc.doctor?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-text-primary">{doc.doctor?.full_name}</p>
                    <p className="text-xs text-text-secondary">
                      {doc.doctor?.specialty || 'Bác sĩ'} • {doc.doctor?.hospital || 'Bệnh viện'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-text-secondary bg-gray-100 px-2 py-1 rounded-md">
                    Hết hạn: {new Date(doc.expiry_date).getFullYear() > 2100 ? 'Vĩnh viễn' : new Date(doc.expiry_date).toLocaleDateString('vi-VN')}
                  </span>
                  <button
                    onClick={() => setRevokePermissionId(doc.id)}
                    className="text-danger text-xs font-semibold hover:underline cursor-pointer"
                  >
                    Thu hồi quyền
                  </button>
                </div>
              </div>
            ))}
            {activePermissions.length === 0 && (
              <div className="p-8 text-center text-text-secondary">
                Không có quyền truy cập nào đang hoạt động
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokePermissionId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-border">
            <div className="w-12 h-12 bg-danger-light/20 text-danger rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-text-primary text-lg">Xác nhận thu hồi quyền</h3>
              <p className="text-sm text-text-secondary mt-1">
                Bạn có chắc chắn muốn thu hồi quyền truy cập hồ sơ sức khỏe của bác sĩ này không? Bác sĩ sẽ không thể xem hồ sơ của bạn nữa.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokePermissionId(null)}
                disabled={revoking}
                className="flex-1 py-2.5 bg-gray-100 text-text-primary rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRevoking(true);
                  await revoke(revokePermissionId);
                  setRevoking(false);
                  setRevokePermissionId(null);
                }}
                disabled={revoking}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl font-semibold text-sm hover:bg-danger-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                {revoking ? 'Đang thu hồi...' : 'Thu hồi ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AccessPageContent />
    </Suspense>
  );
}