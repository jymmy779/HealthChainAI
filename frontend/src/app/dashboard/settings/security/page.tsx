'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { startRegistration } from '@simplewebauthn/browser';
import type { PasskeyCredential } from '@/lib/types';

export default function SecurityPage() {
  const { user, profile, updatePassword, updateProfile, refreshProfile, loading: authLoading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [passkeyError, setPasskeyError] = useState('');

  const fetchPasskeys = useCallback(async () => {
    if (!user) return;
    setLoadingPasskeys(true);
    try {
      const res = await fetch('/api/auth/passkey/list');
      if (res.ok) {
        const data = await res.json();
        // Map database response to frontend keys
        setPasskeys(
          data.map((c: any) => ({
            id: c.id,
            credential_id: c.credential_id,
            device_type: c.device_type,
            created_at: c.created_at,
          })) as PasskeyCredential[]
        );
      }
    } catch (err) {
      console.error('Error fetching passkeys:', err);
    } finally {
      setLoadingPasskeys(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20 animate-fadeIn">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setUpdatingPassword(false);

    if (error) {
      setPasswordError(error);
    } else {
      setPasswordSuccess('Cập nhật mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyError('');
    try {
      // 1. Get options from API
      const optionsRes = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-options' }),
      });

      const options = await optionsRes.json();
      if (options.error) {
        setPasskeyError(options.error);
        return;
      }

      // 2. Start WebAuthn registration
      const attResp = await startRegistration(options);

      // 3. Verify on server
      const verifyRes = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', credential: attResp }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.error) {
        setPasskeyError(verifyData.error);
      } else if (verifyData.verified) {
        await refreshProfile();
        await fetchPasskeys();
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotAllowedError') {
        setPasskeyError('Có lỗi xảy ra khi tạo Passkey');
      }
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Passkey này?')) return;
    setPasskeyError('');

    try {
      const res = await fetch(`/api/auth/passkey/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setPasskeyError(data.detail || 'Lỗi khi xóa Passkey.');
        return;
      }

      const remainingPasskeys = passkeys.filter(k => k.id !== id);
      setPasskeys(remainingPasskeys);

      if (remainingPasskeys.length === 0) {
        await updateProfile({ passkey_enabled: false });
        await refreshProfile();
      }
    } catch (err: any) {
      setPasskeyError(err.message || 'Lỗi kết nối khi xóa Passkey.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
          <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Bảo mật</h1>
      </div>

      {/* Change Password */}
      <form onSubmit={handlePasswordUpdate} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Đổi mật khẩu</h2>
        
        {passwordError && (
          <div className="p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="p-3 bg-secondary-light/20 text-secondary rounded-xl text-sm font-medium">
            {passwordSuccess}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary outline-none transition-all text-base"
          />
          <button
            type="submit"
            disabled={updatingPassword}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {updatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>

      {/* Passkey */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Passkey (Vân tay / Face ID)</h2>
            <p className="text-sm text-text-secondary">Sử dụng sinh trắc học thiết bị để đăng nhập nhanh chóng</p>
          </div>
          <button
            onClick={handleRegisterPasskey}
            className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-semibold hover:bg-secondary-dark transition-all"
          >
            + Thêm khóa
          </button>
        </div>

        {passkeyError && (
          <div className="p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">
            {passkeyError}
          </div>
        )}

        {loadingPasskeys ? (
          <p className="text-sm text-text-secondary">Đang tải danh sách Passkeys...</p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-text-secondary bg-gray-50 rounded-xl p-4 text-center">
            Bạn chưa đăng ký thiết bị Passkey nào.
          </p>
        ) : (
          <div className="space-y-2">
            {passkeys.map((key) => (
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
                    <p className="text-xs text-text-secondary">
                      Đăng ký ngày: {new Date(key.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePasskey(key.id)}
                  className="text-danger text-xs font-medium hover:underline"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Devices Mock */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4">Thiết bị đang đăng nhập</h2>
        <div className="space-y-3">
          {[
            { device: 'Thiết bị hiện tại (Trình duyệt)', time: 'Đang hoạt động', current: true },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-light rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-text-primary">{d.device} {d.current && <span className="text-xs text-secondary font-normal">(Hiện tại)</span>}</p>
                  <p className="text-xs text-text-secondary">{d.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
