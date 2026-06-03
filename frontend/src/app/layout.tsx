import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "HealthChain AI - Quản lý Hồ sơ Sức khỏe Cá nhân",
  description:
    "Hệ thống Quản lý Hồ sơ Sức khỏe Cá nhân Bảo mật dựa trên Blockchain kết hợp Trí tuệ Nhân tạo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-primary font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
