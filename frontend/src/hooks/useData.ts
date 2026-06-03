'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type {
  HealthMetric,
  HealthRecord,
  AccessPermission,
  AccessLog,
  Notification,
  Reminder,
  Profile,
} from '@/lib/types';

// ============================================================
// Health Metrics
// ============================================================
export function useHealthMetrics() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const metrics = await res.json();
        setData(metrics || []);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const add = async (metric: Omit<HealthMetric, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi lưu chỉ số.' };
      }
      await fetchMetrics();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi lưu chỉ số.' };
    }
  };

  return { data, loading, refetch: fetchMetrics, add };
}

// ============================================================
// Health Records
// ============================================================
export function useHealthRecords() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const records = await res.json();
        setData(records || []);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const add = async (
    record: Omit<HealthRecord, 'id' | 'user_id' | 'created_at'>,
    file?: File
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const formData = new FormData();
      formData.append('name', record.name);
      formData.append('type', record.type);
      formData.append('type_label', record.type_label);
      formData.append('date_val', record.date);
      if (record.description) formData.append('description', record.description);
      if (record.hospital) formData.append('hospital', record.hospital);
      if (record.doctor) formData.append('doctor', record.doctor);
      if (record.transaction_hash) formData.append('transaction_hash', record.transaction_hash);
      
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/records', {
        method: 'POST',
        body: formData, // browser sets multipart/form-data boundary automatically
      });

      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi thêm hồ sơ y tế.' };
      }

      await fetchRecords();
      return { error: null, record: resData };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi thêm hồ sơ y tế.' };
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi xóa hồ sơ.' };
      }
      await fetchRecords();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi kết nối xóa hồ sơ.' };
    }
  };

  const analyze = async (id: string) => {
    try {
      const res = await fetch(`/api/records/${id}/analyze`, {
        method: 'POST',
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi phân tích AI hồ sơ y tế.' };
      }
      return { error: null, data: resData };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi phân tích AI.' };
    }
  };

  return { data, loading, refetch: fetchRecords, add, remove, analyze };
}

// ============================================================
// Access Permissions
// ============================================================
export function useAccessPermissions() {
  const { user } = useAuth();
  const [data, setData] = useState<AccessPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const permissions = await res.json();
        setData(permissions || []);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const grant = async (
    doctorId: string,
    expiryDate: string,
    accessLevel: string,
    limitedRecords?: string[]
  ) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          expiry_date: expiryDate,
          access_level: accessLevel,
          limited_records: limitedRecords || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi cấp quyền truy cập.' };
      }
      await fetchPermissions();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi cấp quyền.' };
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch(`/api/permissions/${id}/revoke`, {
        method: 'PUT',
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi thu hồi quyền.' };
      }
      await fetchPermissions();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi thu hồi quyền.' };
    }
  };

  return { data, loading, refetch: fetchPermissions, grant, revoke };
}

// ============================================================
// Access Logs
// ============================================================
export function useAccessLogs() {
  const { user } = useAuth();
  const [data, setData] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const logs = await res.json();
        setData(logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { data, loading, refetch: fetchLogs };
}

// ============================================================
// Notifications
// ============================================================
export function useNotifications() {
  const { user } = useAuth();
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const notifs = await res.json();
        setData(notifs || []);
        setUnreadCount((notifs || []).filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      await fetchNotifs();
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/notifications/read-all/mark', {
        method: 'PUT',
      });
      await fetchNotifs();
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  return { data, loading, unreadCount, refetch: fetchNotifs, markAsRead, markAllAsRead };
}

// ============================================================
// Reminders
// ============================================================
export function useReminders() {
  const { user } = useAuth();
  const [data, setData] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const reminders = await res.json();
        setData(reminders || []);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const add = async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi thêm nhắc nhở.' };
      }
      await fetchReminders();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi thêm nhắc nhở.' };
    }
  };

  const update = async (id: string, updates: Partial<Reminder>) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi cập nhật nhắc nhở.' };
      }
      await fetchReminders();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi cập nhật.' };
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      });
      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.detail || 'Lỗi xóa nhắc nhở.' };
      }
      await fetchReminders();
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Lỗi mạng khi xóa.' };
    }
  };

  return { data, loading, refetch: fetchReminders, add, update, remove };
}

// ============================================================
// Doctors list (for granting access)
// ============================================================
export function useDoctors() {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch('/api/auth/doctors');
        if (res.ok) {
          const docs = await res.json();
          setData(docs || []);
        }
      } catch (err) {
        console.error('Error fetching doctors list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return { data, loading };
}

// ============================================================
// AI Predictions
// ============================================================
export function useAIPredictions() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/metrics/predictions');
      if (res.ok) {
        const predictions = await res.json();
        setData(predictions);
      }
    } catch (err) {
      console.error('Error fetching AI predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return { data, loading, refetch: fetchPredictions };
}
