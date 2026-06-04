'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

// Define lightweight mock types to prevent compilation errors
interface User {
  id: string;
  email: string;
}

interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: 'patient' | 'doctor';
  specialty?: string;
  hospital?: string;
  licenseNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data as Profile);
        const userData = { id: data.id, email: data.email || '' };
        setUser(userData);
        setSession({ access_token: 'local_jwt', user: userData });
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
        
        // Revoke cookie on backend and redirect if unauthorized on a protected route
        if (res.status === 401) {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (e) {}
          if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/doctor'))) {
            router.push('/auth/login');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || 'Đăng nhập thất bại.' };
      }
      
      const userData = { id: data.profile.id, email: data.profile.email };
      setUser(userData);
      setProfile(data.profile as Profile);
      setSession({ access_token: data.access_token, user: userData });
      
      showToast('Đăng nhập thành công!', 'success');
      if (data.profile?.role === 'doctor') {
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi kết nối máy chủ.' };
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/phone/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || 'Lỗi gửi mã OTP.' };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi kết nối máy chủ.' };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || 'Mã OTP không chính xác.' };
      }
      
      const userData = { id: data.profile.id, email: data.profile.email };
      setUser(userData);
      setProfile(data.profile as Profile);
      setSession({ access_token: data.access_token, user: userData });
      
      showToast('Đăng nhập thành công!', 'success');
      if (data.profile?.role === 'doctor') {
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi kết nối xác thực.' };
    }
  };

  const signInWithGoogle = async () => {
    // Standard mock redirection for social login
    console.log('Google login requested');
    router.push('/dashboard');
  };

  const signUp = async (data: SignUpData) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth || null,
          gender: data.gender || null,
          role: data.role || 'patient',
          specialty: data.specialty || null,
          hospital: data.hospital || null,
          license_number: data.licenseNumber || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Đăng ký thất bại.' };
      }

      // Automatically fetch profile after successful signup
      await fetchProfile();
      showToast('Đăng ký tài khoản thành công!', 'success');
      if (data.role === 'doctor') {
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard');
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi kết nối máy chủ.' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    showToast('Đăng xuất thành công!', 'success');
    router.push('/auth/login');
  };

  const resetPassword = async (email: string) => {
    // Simple mock or notification since email transport is local
    console.log('Reset password for email:', email);
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || 'Cập nhật mật khẩu thất bại.' };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi kết nối cập nhật mật khẩu.' };
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Cập nhật thông tin thất bại.' };
      }
      
      setProfile(resData as Profile);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi kết nối cập nhật thông tin.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithEmail,
        signInWithPhone,
        verifyOtp,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] animate-slideDown max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-border p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              toast.type === 'error' ? 'bg-danger-light/20 text-danger' :
              toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {toast.type === 'success' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span className="text-sm font-semibold text-text-primary truncate">{toast.message}</span>
          </div>
          <button 
            onClick={() => {
              setToast(null);
              if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
            aria-label="Đóng thông báo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
