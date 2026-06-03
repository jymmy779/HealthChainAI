'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function EditProfilePage() {
  const { profile, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Nam');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender(profile.gender || 'Nam');
      setHeight(profile.height?.toString() || '');
      setWeight(profile.weight?.toString() || '');
      setBloodGroup(profile.blood_group || 'O+');
      setAllergies(profile.allergies?.join(', ') || '');
      setChronicDiseases(profile.chronic_diseases?.join(', ') || '');
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }

    setSubmitting(true);
    setError('');

    const allergiesArray = allergies
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const chronicDiseasesArray = chronicDiseases
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const updates = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      date_of_birth: dateOfBirth || null,
      gender,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      blood_group: bloodGroup,
      allergies: allergiesArray,
      chronic_diseases: chronicDiseasesArray,
    };

    const { error: updateError } = await updateProfile(updates);

    setSubmitting(false);

    if (updateError) {
      setError(updateError);
    } else {
      router.push('/dashboard/profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/profile" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
            <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Chỉnh sửa thông tin</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-light/20 text-danger rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white">
              {fullName?.charAt(0) || '?'}
            </div>
            <div>
              <button type="button" className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all">
                Cập nhật ảnh
              </button>
              <p className="text-xs text-text-secondary mt-1">JPG, PNG tối đa 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ngày sinh</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Chiều cao (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Cân nặng (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nhóm máu</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base text-text-primary"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Dị ứng thuốc (phân tách bằng dấu phẩy)</label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Ví dụ: Penicillin, Aspirin"
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Bệnh mãn tính (phân tách bằng dấu phẩy)</label>
              <textarea
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
                placeholder="Ví dụ: Tiểu đường Type 2, Cao huyết áp"
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition-all text-base resize-none"
              />
            </div>
          </div>

          <div className="bg-warning-light/30 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-text-primary">Thay đổi thông tin quan trạng có thể được đồng bộ hóa lên blockchain bảo mật.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-secondary text-white rounded-2xl font-semibold text-base hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/25 disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
