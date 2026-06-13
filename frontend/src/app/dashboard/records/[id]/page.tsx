'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHealthRecords } from '@/hooks/useData';
import Button from '@/components/ui/Button';

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: records, loading, remove, analyze, refetch } = useHealthRecords();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);



  const handleVerifyIntegrity = async () => {
    if (!record) return;
    setVerifying(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const res = await fetch(`/api/records/${record.id}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        const errData = await res.json();
        setVerifyError(errData.detail || 'Lỗi xác minh tính toàn vẹn hồ sơ.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Lỗi mạng khi thực hiện xác minh.');
    } finally {
      setVerifying(false);
    }
  };

  const record = records.find(r => r.id === params.id);
  const isImage = record && record.file_url && (
    record.file_url.toLowerCase().endsWith('.png') ||
    record.file_url.toLowerCase().endsWith('.jpg') ||
    record.file_url.toLowerCase().endsWith('.jpeg') ||
    record.file_url.toLowerCase().endsWith('.webp') ||
    record.file_url.toLowerCase().endsWith('.gif') ||
    record.type === 'hinh-anh'
  );

  useEffect(() => {
    if (record && record.metric) {
      setAnalysisResult({
        success: true,
        message: "Hồ sơ đã được phân tích bằng AI trước đó.",
        extracted_data: {
          blood_sugar: record.metric.blood_sugar,
          systolic: record.metric.systolic,
          diastolic: record.metric.diastolic,
          heart_rate: record.metric.heart_rate,
          bmi: record.metric.bmi,
          weight: record.metric.weight
        },
        metric_id: record.metric.id
      });
    }
  }, [record]);

  const handleAIAnalyze = async () => {
    if (!record) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    const { error, data } = await analyze(record.id);
    setAnalyzing(false);
    if (!error) {
      setAnalysisResult(data);
      if (typeof refetch === 'function') {
        refetch();
      }
    } else {
      alert(`Lỗi phân tích AI: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 animate-fadeIn">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        <Button onClick={() => router.push('/dashboard/records')} variant="primary">
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

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await remove(record.id);
    setDeleting(false);
    if (!error) {
      router.push('/dashboard/records');
    } else {
      alert(`Lỗi khi xóa hồ sơ: ${error}`);
    }
  };

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
                {record.type_label}
              </span>
            </div>
            <div className="flex gap-2">
              {record.file_url && (
                <a
                  href={record.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )}
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
              <p className="text-base font-medium text-text-primary mt-1">{record.hospital || 'Không có'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Bác sĩ phụ trách</p>
              <p className="text-base font-medium text-text-primary mt-1">{record.doctor || 'Không có'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Kích thước file</p>
              <p className="text-base font-medium text-text-primary mt-1">{record.file_size || '0 MB'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Trạng thái Blockchain</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${record.blockchain_status === 'confirmed' ? 'bg-secondary animate-pulse-soft' : 'bg-warning animate-pulse-soft'}`} />
                <span className={`text-base font-medium ${record.blockchain_status === 'confirmed' ? 'text-secondary' : 'text-warning'}`}>
                  {record.blockchain_status === 'confirmed' ? 'Đã xác nhận' : 'Đang xử lý'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Transaction Hash</p>
              <p className="text-sm font-mono text-text-primary mt-1 truncate" title={record.transaction_hash || ''}>
                {record.transaction_hash || 'Đang tạo...'}
              </p>
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

        {/* IPFS Info & Blockchain Integrity Verify */}
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-primary-light/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-semibold text-primary">Bảo mật Blockchain</span>
              </div>
              <p className="text-sm text-text-secondary">Hồ sơ này đã được mã hóa và lưu trữ trên IPFS. Hash giao dịch được ghi nhận bất biến trên Blockchain Polygon.</p>
              <p className="text-xs font-mono text-text-secondary mt-2">IPFS Hash: {record.ipfs_hash || 'Đang tạo...'}</p>
            </div>
            <button
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 cursor-pointer self-start md:self-center"
            >
              {verifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác minh...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Xác minh tính toàn vẹn</span>
                </>
              )}
            </button>
          </div>

          {verifyError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {verifyError}
            </div>
          )}

          {verifyResult && (
            <div className={`p-5 rounded-2xl border animate-fadeIn space-y-4 ${
              verifyResult.is_matching
                ? 'bg-emerald-50/30 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/30 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  verifyResult.is_matching ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {verifyResult.is_matching ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">
                    {verifyResult.is_matching
                      ? 'Xác minh tính toàn vẹn thành công'
                      : 'CẢNH BÁO: Phát hiện sai lệch dữ liệu!'}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {verifyResult.is_matching
                      ? 'Tập tin lưu trên máy chủ hoàn toàn trùng khớp với chữ ký số (Hash) được đăng ký trên Blockchain Polygon. Dữ liệu của bạn chưa từng bị chỉnh sửa.'
                      : 'Mã SHA-256 của tập tin hiện tại không khớp với mã băm đã đăng ký trên hợp đồng thông minh. Dữ liệu có thể đã bị can thiệp trái phép!'}
                  </p>
                </div>
              </div>

              {/* Hash Details */}
              <div className="bg-white border border-gray-100 rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-text-secondary block font-sans font-semibold uppercase">Mã băm hiện tại (Server File Hash)</span>
                  <span className="text-text-primary break-all">{verifyResult.local_hash}</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5">
                  <span className="text-[10px] text-text-secondary block font-sans font-semibold uppercase">Mã băm gốc (On-Chain Blockchain Hash)</span>
                  <span className={`break-all ${verifyResult.is_matching ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold animate-pulse'}`}>
                    {verifyResult.on_chain_hash}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-text-secondary font-sans">
                  <div className="min-w-[120px]">
                    <span className="text-[10px] block font-semibold uppercase">Đăng ký bởi</span>
                    <span className="font-mono text-[10px] text-text-primary break-all">{verifyResult.registered_by}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-semibold uppercase">Thời điểm ghi nhận</span>
                    <span className="text-[10px] text-text-primary">
                      {verifyResult.timestamp > 0 ? new Date(verifyResult.timestamp * 1000).toLocaleString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-semibold uppercase">Mạng lưới</span>
                    <span className="text-[10px] text-text-primary font-medium">
                      {verifyResult.blockchain_connected ? 'Polygon (Mainnet)' : 'Polygon Sandbox (Local Fallback)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="px-6 pb-6">
          {record.type === 'xet-nghiem-mau' ? (
            /* Chỉ hiện phân tích chỉ số cho xét nghiệm máu */
            <div className="bg-gradient-to-r from-primary-light/50 to-secondary-light/30 border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                    <h3 className="text-base font-bold text-text-primary">Trợ lý Phân tích Y khoa AI</h3>
                    {record.metric_id && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-secondary-light text-secondary border border-secondary/20 rounded-md animate-fadeIn">
                        Đã phân tích
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">
                    Tự động quét tài liệu để trích xuất các chỉ số sinh hóa (Đường huyết, Huyết áp, Nhịp tim, BMI) và chạy mô hình dự báo nguy cơ sức khỏe.
                  </p>
                </div>
                <button
                  onClick={handleAIAnalyze}
                  disabled={analyzing}
                  className="py-3 px-5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>{record.metric_id ? "Cập nhật phân tích" : "Phân tích chỉ số ngay"}</span>
                    </>
                  )}
                </button>
              </div>
              {analysisResult && (
                <div className="mt-4 p-4 bg-white/85 rounded-xl border border-white/45 space-y-2 animate-fadeIn">
                  <p className="text-xs font-semibold text-secondary flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {analysisResult.message}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {analysisResult.extracted_data.blood_sugar && (
                      <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-text-secondary block">Đường huyết</span>
                        <span className="text-sm font-bold text-text-primary">{analysisResult.extracted_data.blood_sugar} <span className="text-[10px] font-normal">mg/dL</span></span>
                      </div>
                    )}
                    {analysisResult.extracted_data.systolic && (
                      <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-text-secondary block">Huyết áp</span>
                        <span className="text-sm font-bold text-text-primary">{analysisResult.extracted_data.systolic}/{analysisResult.extracted_data.diastolic} <span className="text-[10px] font-normal">mmHg</span></span>
                      </div>
                    )}
                    {analysisResult.extracted_data.heart_rate && (
                      <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-text-secondary block">Nhịp tim</span>
                        <span className="text-sm font-bold text-text-primary">{analysisResult.extracted_data.heart_rate} <span className="text-[10px] font-normal">bpm</span></span>
                      </div>
                    )}
                    {analysisResult.extracted_data.bmi && (
                      <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-text-secondary block">BMI</span>
                        <span className="text-sm font-bold text-text-primary">{analysisResult.extracted_data.bmi} <span className="text-[10px] font-normal">kg/m²</span></span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => router.push(`/dashboard/ai/report?metric_id=${analysisResult.metric_id}`)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem báo cáo phân tích chi tiết AI &rarr;</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Loại tài liệu khác — không có chỉ số số học để phân tích */
            <div className="bg-gray-50 border border-border rounded-2xl p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeStyle.bg}`}>
                <svg className={`w-5 h-5 ${typeStyle.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">
                  {record.type === 'hinh-anh' && 'Chẩn đoán hình ảnh — không có chỉ số sinh hóa'}
                  {record.type === 'don-thuoc' && 'Đơn thuốc — không có chỉ số sinh hóa'}
                  {record.type === 'bao-cao' && 'Báo cáo bác sĩ — không có chỉ số sinh hóa'}
                </h3>
                <p className="text-sm text-text-secondary">
                  {record.type === 'hinh-anh' && 'Tính năng phân tích chỉ số chỉ áp dụng cho Xét nghiệm máu. Để đọc hiểu kết quả X-quang / MRI / siêu âm, hãy dùng tính năng Trợ lý Y khoa AI bên dưới.'}
                  {record.type === 'don-thuoc' && 'Tính năng phân tích chỉ số chỉ áp dụng cho Xét nghiệm máu. Để tra cứu thuốc, liều dùng và tác dụng phụ, hãy dùng tính năng Trợ lý Y khoa AI bên dưới.'}
                  {record.type === 'bao-cao' && 'Tính năng phân tích chỉ số chỉ áp dụng cho Xét nghiệm máu. Để đọc hiểu báo cáo bác sĩ, hãy dùng tính năng Trợ lý Y khoa AI bên dưới.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* AI Chatbot Banner */}
        <div className="px-6 pb-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center text-primary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-text-primary">Trợ lý Y khoa AI (Hỏi đáp & Giải thích)</h3>
              </div>
              <p className="text-sm text-text-secondary mt-1 max-w-lg">
                Bạn cần tìm hiểu sâu hơn về bệnh án, các chỉ số xét nghiệm hoặc đơn thuốc này? Hãy trò chuyện riêng tư với trợ lý AI.
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/ai-chat?recordId=${record.id}`)}
              className="py-3 px-5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all flex items-center gap-2 flex-shrink-0 shadow-md shadow-primary/10 cursor-pointer self-start sm:self-center"
            >
              <span>Trò chuyện với AI</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Preview */}
        {record.file_url && (
          <div className="px-6 pb-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Bản xem trước tài liệu</p>
              <a
                href={`/api/records/${record.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Mở trong tab mới</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="border border-border rounded-xl overflow-hidden bg-gray-50/50 h-[500px] flex items-center justify-center relative">
              {isImage ? (
                <img
                  src={`/api/records/${record.id}/file`}
                  alt={record.name}
                  className="max-w-full max-h-full object-contain animate-fadeIn"
                />
              ) : (
                <iframe
                  src={`/api/records/${record.id}/file`}
                  className="w-full h-full border-none animate-fadeIn"
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3">
          {record.file_url ? (
            <a
              href={record.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="primary" size="lg" className="w-full" icon={() => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                Tải xuống
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="lg" className="flex-1" disabled icon={() => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
              Không có file đính kèm
            </Button>
          )}
          <Button
            onClick={() => router.push('/dashboard/access')}
            variant="outline"
            size="lg"
            className="flex-1"
            icon={() => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}
          >
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
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 px-4 bg-danger text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}