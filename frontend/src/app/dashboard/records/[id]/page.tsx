'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { healthRecords } from '@/data/mockData';
import Button from '@/components/ui/Button';

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const record = healthRecords.find(r => r.id === params.id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
        <div className="w-20 h-20 bg-danger-light rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Không tìm thấy hồ sơ</h2>
        <p className="text-text-secondary mb-6">Hồ sơ bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => router.push('/dashboard/records/list')} variant="primary">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const getTypeStyle = (type: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      'xet-nghiem-mau': { bg: 'bg-danger-light', text: 'text-danger', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      'don-thuoc': { bg: 'bg-warning-light', text: 'text-warning', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      'hinh-anh': { bg: 'bg-primary-light', text: 'text-primary', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
      'bao-cao': { bg: 'bg-secondary-light', text: 'text-secondary', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    };
    return styles[type] || styles['bao-cao'];
  };

  const typeStyle = getTypeStyle(record.type);

  return (
    <div className="animate-fadeIn space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Chi tiết hồ sơ</h1>
      </div>

      {/* Record Info Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Top Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${typeStyle.bg}`}>
              <svg className={`w-7 h-7 ${typeStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeStyle.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-primary">{record.name}</h2>
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-text-secondary">
                {record.typeLabel}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors">
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Ngày tạo</p>
              <p className="text-base font-medium text-text-primary mt-1">{record.date}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Bệnh viện / Phòng khám</p>
              <p className="text-base font-medium text-text-primary mt-1">{record.hospital}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Bác sĩ phụ trách</p>
              <p className="text-base font-medium text-text-primary mt-1">{record.doctor}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Kích thước file</p>
              <p className="text-base font-medium text-text-primary mt-1">{record.fileSize}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Trạng thái Blockchain</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-soft" />
                <span className="text-base font-medium text-secondary">Đã xác nhận</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Transaction Hash</p>
              <p className="text-sm font-mono text-text-primary mt-1 truncate">{record.transactionHash}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {record.description && (
          <div className="px-6 pb-6">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Mô tả</p>
            <p className="text-base text-text-primary bg-gray-50 rounded-xl p-4">{record.description}</p>
          </div>
        )}

        {/* IPFS Info */}
        <div className="px-6 pb-6">
          <div className="bg-primary-light/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-semibold text-primary">Bảo mật Blockchain</span>
            </div>
            <p className="text-sm text-text-secondary">Hồ sơ này đã được mã hóa và lưu trữ trên IPFS. Hash giao dịch được ghi nhận bất biến trên Blockchain Polygon.</p>
            <p className="text-xs font-mono text-text-secondary mt-2">IPFS Hash: {record.ipfsHash}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3">
          <Button variant="primary" size="lg" className="flex-1" icon={() => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
            Tải xuống
          </Button>
          <Button variant="outline" size="lg" className="flex-1" icon={() => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}>
            Chia sẻ với bác sĩ
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slideUp p-6 text-center">
            <div className="w-16 h-16 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Xác nhận xóa hồ sơ</h3>
            <p className="text-sm text-text-secondary mb-6">
              Dữ liệu trên Blockchain là bất biến và không thể xóa. Hồ sơ sẽ được ẩn khỏi tầm nhìn của bạn. Bạn chắc chắn muốn tiếp tục?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-text-primary rounded-xl font-semibold hover:bg-gray-200 transition-all">
                Hủy
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 bg-danger text-white rounded-xl font-semibold hover:bg-red-700 transition-all">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}