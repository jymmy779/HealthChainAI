'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoctors } from '@/hooks/useData';
import Link from 'next/link';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;
  const { data: doctors, loading } = useDoctors();

  const doctor = doctors.find((doc) => doc.id === doctorId);

  const handleSelectDoctor = () => {
    if (doctor) {
      router.push(`/dashboard/access?grantTo=${doctor.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-text-secondary">Đang tải thông tin bác sĩ...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-danger-light/20 text-danger rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Không tìm thấy bác sĩ</h2>
          <p className="text-sm text-text-secondary mt-1">
            Bác sĩ không tồn tại hoặc đã ngừng hoạt động trong hệ thống.
          </p>
        </div>
        <Link
          href="/dashboard/access/doctors"
          className="inline-block px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all"
        >
          Trở lại danh sách bác sĩ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/access/doctors"
          className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-primary transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách
        </Link>
        
        <span className="text-xs text-text-secondary">
          ID: <span className="font-mono">{doctor.id.substring(0, 8)}...</span>
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm text-center border border-border relative overflow-hidden">
        {/* Accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary-light"></div>
        
        <div className="relative inline-block mt-4">
          {doctor.avatar_url ? (
            <img
              src={doctor.avatar_url}
              alt={doctor.full_name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white mx-auto shadow-lg">
              {doctor.full_name?.charAt(0) || '?'}
            </div>
          )}
          {doctor.is_verified && (
            <span
              className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 rounded-full shadow-md flex items-center justify-center border-2 border-white text-white"
              title="Chứng chỉ hành nghề đã xác minh"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-text-primary mt-4">{doctor.full_name}</h1>
        <p className="text-primary font-semibold text-base mt-1">
          {doctor.specialty || 'Bác sĩ chuyên khoa'}
        </p>
        <p className="text-text-secondary text-sm mt-1">{doctor.hospital || 'Bệnh viện / Phòng khám'}</p>

        <div className="flex justify-center gap-2 mt-4">
          <span className={`px-3.5 py-1 text-xs font-semibold rounded-full ${
            doctor.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {doctor.is_verified ? 'Đã xác minh thông tin' : 'Chờ xác minh thông tin'}
          </span>
          <span className="px-3.5 py-1 bg-primary-light/30 text-primary text-xs font-semibold rounded-full">
            Bác sĩ hệ thống
          </span>
        </div>
      </div>

      {/* Professional Details Section */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-border shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-text-primary border-b border-gray-100 pb-3">
          Thông tin hành nghề & liên hệ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Số điện thoại liên hệ</p>
            <p className="text-base font-semibold text-text-primary mt-1">{doctor.phone || 'Chưa công khai'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Địa chỉ email</p>
            <p className="text-base font-semibold text-text-primary mt-1">{doctor.email || 'Chưa công khai'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Nơi công tác hiện tại</p>
            <p className="text-base font-semibold text-text-primary mt-1">{doctor.hospital || 'Chưa cập nhật'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Chuyên khoa chính</p>
            <p className="text-base font-semibold text-text-primary mt-1">{doctor.specialty || 'Chưa cập nhật'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Số chứng chỉ hành nghề (CCHN)</p>
            <p className="text-base font-semibold text-text-primary font-mono mt-1">{doctor.license_number || 'Chưa cập nhật'}</p>
          </div>
        </div>

        {/* Certificate Display */}
        {doctor.certificate_url && (
          <div className="pt-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Minh chứng bằng cấp</p>
            <div className="flex items-center justify-between bg-gray-50 border border-border rounded-xl p-4 text-sm">
              <div className="flex items-center gap-2 truncate">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-text-primary truncate">
                  {doctor.certificate_name || 'Chung_Chi_Hanh_Nghe.pdf'}
                </span>
              </div>
              <a
                href={doctor.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline shrink-0 text-xs md:text-sm bg-white px-3 py-1.5 rounded-lg border border-border hover:border-primary transition-all"
              >
                Xem tài liệu
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Grant Action Button */}
      <button
        onClick={handleSelectDoctor}
        className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-2xl font-bold text-base hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Xác nhận chọn Bác sĩ này để cấp quyền
      </button>
    </div>
  );
}
