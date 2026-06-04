'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { startRegistration } from '@simplewebauthn/browser';
import type { PasskeyCredential } from '@/lib/types';

interface UserSession {
  id: string;
  ip_address: string | null;
  device_label: string;
  user_agent: string | null;
  created_at: string | null;
  last_active: string | null;
}

export default function SecurityPage() {
  const { user, profile, updatePassword, updateProfile, refreshProfile, loading: authLoading } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [passkeyError, setPasskeyError] = useState('');

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // ── Passkeys ─────────────────────────────────────────────
  const fetchPasskeys = useCallback(async () => {
    if (!user) return;
    setLoadingPasskeys(true);
    try {
      const res = await fetch('/api/auth/passkey/list');
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.map((c: any) => ({
          id: c.id, credential_id: c.credential_id,
          device_type: c.device_type, created_at: c.created_at,
        })) as PasskeyCredential[]);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingPasskeys(false); }
  }, [user]);

  // ── Sessions ─────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) setSessions(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingSessions(false); }
  }, [user]);

  useEffect(() => {
    fetchPasskeys();
    fetchSessions();
  }, [fetchPasskeys, fetchSessions]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20 animate-fadeIn">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(''); setPasswordSuccess('');
    if (!newPassword || !confirmPassword) { setPasswordError('Vui lòng nhập mật khẩu mới'); return; }
    if (newPassword.length < 6) { setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Mật khẩu xác nhận không khớp'); return; }
    setUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setUpdatingPassword(false);
    if (error) setPasswordError(error);
    else { setPasswordSuccess('Cập nhật mật khẩu thành công!'); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyError('');
    try {
      const optRes = await fetch('/api/auth/passkey/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-options' }),
      });
      const opts = await optRes.json();
      if (opts.error) { setPasskeyError(opts.error); return; }
      const attResp = await startRegistration(opts);
      const verRes = await fetch('/api/auth/passkey/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', credential: attResp }),
      });
      const ver = await verRes.json();
      if (ver.error) setPasskeyError(ver.error);
      else if (ver.verified) { await refreshProfile(); await fetchPasskeys(); }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') setPasskeyError('Có lỗi xảy ra khi tạo Passkey');
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Passkey này?')) return;
    setPasskeyError('');
    try {
      const res = await fetch(`/api/auth/passkey/${id}`, { method: 'DELETE' });
      if (!res.ok) { setPasskeyError((await res.json()).detail || 'Lỗi khi xóa Passkey.'); return; }
      const rem = passkeys.filter(k => k.id !== id);
      setPasskeys(rem);
      if (rem.length === 0) { await updateProfile({ passkey_enabled: false }); await refreshProfile(); }
    } catch (err: any) { setPasskeyError(err.message || 'Lỗi kết nối.'); }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Thu hồi phiên này sẽ đăng xuất thiết bị đó. Tiếp tục?')) return;
    setRevokingId(sessionId); setSessionError('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) setSessionError((await res.json()).detail || 'Không thể thu hồi phiên.');
      else setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) { setSessionError(err.message || 'Lỗi kết nối.'); }
    finally { setRevokingId(null); }
  };

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return 'Không rõ';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return new Date(iso).toLocaleDateString('vi-VN');
  };

  const isMobile = (label: string) =>
    label.toLowerCase().includes('iphone') || label.toLowerCase().includes('android');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings"
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
          <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Bảo mật</h1>
      </div>

      {/* ── Đổi mật khẩu ──────────────────────────────── */}
      <form onSubmit={handlePasswordUpdate} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Đổi mật khẩu</h2>
        {passwordError && <div className="p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">{passwordError}</div>}
        {passwordSuccess && <div className="p-3 bg-secondary-light/20 text-secondary rounded-xl text-sm font-medium">{passwordSuccess}</div>}
        <div className="space-y-3">
          <input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base" />
          <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base" />
          <button type="submit" disabled={updatingPassword}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all disabled:opacity-50">
            {updatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>

      {/* ── Passkey ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Passkey (Vân tay / Face ID)</h2>
            <p className="text-sm text-text-secondary">Sử dụng sinh trắc học thiết bị để đăng nhập nhanh chóng</p>
          </div>
          <button onClick={handleRegisterPasskey}
            className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-semibold hover:bg-secondary-dark transition-all">
            + Thêm khóa
          </button>
        </div>
        {passkeyError && <div className="p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">{passkeyError}</div>}
        {loadingPasskeys ? (
          <p className="text-sm text-text-secondary">Đang tải danh sách Passkeys...</p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-text-secondary bg-gray-50 rounded-xl p-4 text-center">Bạn chưa đăng ký thiết bị Passkey nào.</p>
        ) : (
          <div className="space-y-2">
            {passkeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-light rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">
                      {key.device_type === 'singleDevice' ? 'Thiết bị di động/Cá nhân' : 'Khóa bảo mật phần cứng'}
                    </p>
                    <p className="text-xs text-text-secondary">Đăng ký ngày: {new Date(key.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <button onClick={() => handleDeletePasskey(key.id)} className="text-danger text-xs font-medium hover:underline">Xóa</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Phiên đăng nhập ───────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Thiết bị đang đăng nhập</h2>
            <p className="text-sm text-text-secondary">Quản lý các phiên hoạt động và đăng xuất từ xa</p>
          </div>
          <button onClick={fetchSessions} className="text-xs text-primary font-semibold hover:underline">Làm mới</button>
        </div>

        {sessionError && <div className="p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">{sessionError}</div>}

        {sessions.length > 1 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-700">
              Phát hiện <strong>{sessions.length} phiên</strong> đang hoạt động.
              Nếu bạn không nhận ra thiết bị nào, hãy thu hồi ngay.
            </p>
          </div>
        )}

        {loadingSessions ? (
          <p className="text-sm text-text-secondary text-center py-4">Đang tải danh sách thiết bị...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-text-secondary bg-gray-50 rounded-xl p-4 text-center">Không có phiên đang hoạt động.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s, idx) => (
              <div key={s.id}
                className={`flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-primary-light text-primary' : 'bg-gray-100 text-text-secondary'}`}>
                    {isMobile(s.device_label) ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">
                      {s.device_label}
                      {idx === 0 && <span className="ml-2 text-xs text-primary font-normal">(Phiên này)</span>}
                    </p>
                    <p className="text-xs text-text-secondary">
                      IP: {s.ip_address || 'Không rõ'} · Hoạt động {formatRelativeTime(s.last_active)}
                    </p>
                  </div>
                </div>
                {idx !== 0 && (
                  <button onClick={() => handleRevokeSession(s.id)} disabled={revokingId === s.id}
                    className="text-danger text-xs font-medium hover:underline disabled:opacity-50">
                    {revokingId === s.id ? 'Đang xử lý...' : 'Thu hồi'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
