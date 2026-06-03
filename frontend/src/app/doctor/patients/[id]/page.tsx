"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doctorPatients } from "@/data/mockDoctors";

// Import shared mock data for records
import { healthRecords } from "@/data/mockData";

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PdfIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LockClosedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function PatientDetailPage() {
  const params = useParams();
  const patient = doctorPatients.find((p) => p.id === params.id);
  const [documentViewer, setDocumentViewer] = useState<{ open: boolean; record: any }>({
    open: false,
    record: null,
  });

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy bệnh nhân</h2>
        <Link
          href="/doctor/patients"
          className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <BackIcon />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case "xet_nghiem_mau":
      case "xet_nghiem":
        return <PdfIcon />;
      case "don_thuoc":
        return <DocumentIcon />;
      case "hinh_anh":
      case "x_quang":
        return <ImageIcon />;
      case "bao_cao":
        return <FileIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getRecordTypeName = (type: string) => {
    const types: Record<string, string> = {
      xet_nghiem_mau: "Xét nghiệm máu",
      xet_nghiem: "Xét nghiệm",
      don_thuoc: "Đơn thuốc",
      hinh_anh: "Hình ảnh chẩn đoán",
      x_quang: "X-Quang",
      bao_cao: "Báo cáo bác sĩ",
    };
    return types[type] || type;
  };

  const getBlockchainStatus = (record: any) => {
    if (record.blockchainStatus === "confirmed") {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <ShieldCheckIcon />
          <span className="text-xs">Đã xác nhận</span>
        </div>
      );
    }
    if (record.blockchainStatus === "pending") {
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">Đang xử lý</span>
        </div>
      );
    }
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/doctor/patients"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        <BackIcon />
        Quay lại danh sách bệnh nhân
      </Link>

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-gray-500 mt-1">
                  {patient.gender} · {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} tuổi · Nhóm máu {patient.bloodGroup}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                  <LockClosedIcon />
                  <span>Mã hóa đầu cuối</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.chronicDiseases.map((disease: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full font-medium"
                >
                  {disease}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span>SĐT: {patient.phone}</span>
              <span>Email: {patient.email}</span>
              <span>{patient.totalRecords} hồ sơ y tế</span>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Records Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hồ sơ y tế</h2>
              <p className="text-gray-500 text-sm mt-1">
                Các hồ sơ bệnh nhân đã cấp quyền truy cập
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
              <CheckCircleIcon />
              <span>Được cấp quyền</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {healthRecords.slice(0, 5).map((record: any) => (
            <div
              key={record.id}
              className="p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gray-50">
                  {getRecordTypeIcon(record.type || "bao_cao")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{record.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {getRecordTypeName(record.type || "bao_cao")}
                        <span className="mx-2">·</span>
                        {record.date || record.uploadDate}
                        <span className="mx-2">·</span>
                        {formatFileSize(record.fileSize || record.size || 1024000)}
                      </p>
                    </div>
                    {getBlockchainStatus(record)}
                  </div>
                  {record.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {record.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => setDocumentViewer({ open: true, record })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <EyeIcon />
                      Xem hồ sơ
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                      <DownloadIcon />
                      Tải xuống
                    </button>
                    {record.blockchainTx && (
                      <span className="text-xs text-gray-400 font-mono">
                        TX: {record.blockchainTx.slice(0, 10)}...{record.blockchainTx.slice(-6)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Access Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900">Thông tin quyền truy cập</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Mức độ truy cập</span>
              <span className="font-medium text-gray-900">
                {patient.accessLevel === "all" ? "Toàn bộ hồ sơ" :
                 patient.accessLevel === "limited" ? "Một phần (2 hồ sơ)" :
                 "Một hồ sơ cụ thể"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ngày cấp quyền</span>
              <span className="font-medium text-gray-900">
                {new Date(patient.grantedDate).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ngày hết hạn</span>
              <span className={`font-medium ${
                patient.remainingDays > 14 ? "text-emerald-600" :
                patient.remainingDays > 0 ? "text-amber-600" : "text-red-600"
              }`}>
                {new Date(patient.expiryDate).toLocaleDateString("vi-VN")}
                {patient.remainingDays > 0 && ` (còn ${patient.remainingDays} ngày)`}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900">Thống kê truy cập</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Tổng số lần truy cập</span>
              <span className="font-medium text-gray-900">{patient.totalRecords} lần</span>
            </div>
            <div className="flex justify-between">
              <span>Lần truy cập gần nhất</span>
              <span className="font-medium text-gray-900">
                {new Date(patient.lastAccess).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {documentViewer.open && documentViewer.record && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setDocumentViewer({ open: false, record: null })}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {documentViewer.record.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {getRecordTypeName(documentViewer.record.type || "bao_cao")}
                    </p>
                  </div>
                  <button
                    onClick={() => setDocumentViewer({ open: false, record: null })}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <DocumentIcon />
                  <p className="text-gray-500 mt-4">
                    Hồ sơ y tế được mã hóa và lưu trữ an toàn trên Blockchain
                  </p>
                  {documentViewer.record.blockchainTx && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
                      <ShieldCheckIcon />
                      <span>
                        Blockchain TX: {documentViewer.record.blockchainTx.slice(0, 15)}...
                      </span>
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors">
                      <DownloadIcon />
                      Tải xuống
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <LockClosedIcon />
                  <span>Mã hóa AES-256</span>
                </div>
                <button
                  onClick={() => setDocumentViewer({ open: false, record: null })}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}