# HealthChain AI - Hướng dẫn Cài đặt & Khởi chạy dự án

Tài liệu này hướng dẫn chi tiết cách cài đặt và khởi chạy dự án **HealthChain AI** trên một máy tính mới sau khi kéo code từ Git về.

Dự án gồm 2 phần chính:
1. **Backend**: FastAPI (Python) + PostgreSQL/SQLite
2. **Frontend**: Next.js (React)

---

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** (Phiên bản >= 18.x)
- **Python** (Phiên bản >= 3.10)
- **Git**

---

## 🚀 Các bước Setup từ đầu

### Bước 1: Clone mã nguồn và cấu hình Environment

1. Mở Terminal / PowerShell và di chuyển vào thư mục dự án.
2. **Cấu hình Backend Env**:
   - Truy cập thư mục `backend/`.
   - Copy file cấu hình mẫu `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - *Lưu ý*: Mặc định dự án có thể cấu hình kết nối SQLite để chạy nhanh không cần cài PostgreSQL bằng cách đổi `DATABASE_URL` trong `.env` thành:
     ```env
     DATABASE_URL=sqlite:///./healthchain.db
     ```

3. **Cấu hình Frontend Env**:
   - Truy cập thư mục `frontend/`.
   - Copy file cấu hình mẫu `.env.local.example` thành `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```

---

### Bước 2: Cài đặt và khởi chạy Backend (FastAPI)

1. Mở một terminal mới và di chuyển vào thư mục `backend/`:
   ```bash
   cd backend
   ```

2. Tạo môi trường ảo Python (Virtual Environment):
   ```bash
   # Trên Windows:
   python -m venv venv
   # Trên macOS/Linux:
   python3 -m venv venv
   ```

3. Kích hoạt môi trường ảo:
   ```bash
   # Trên Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   
   # Trên Windows (CMD):
   .\venv\Scripts\activate.bat
   
   # Trên macOS/Linux:
   source venv/bin/activate
   ```

4. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```

5. Khởi chạy Backend Server:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```
   *Backend sẽ chạy tại địa chỉ:* `http://localhost:8000`

---

### Bước 3: Cài đặt và khởi chạy Frontend (Next.js)

1. Mở một terminal khác và di chuyển vào thư mục `frontend/`:
   ```bash
   cd frontend
   ```

2. Cài đặt các gói thư viện Node.js:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Khởi chạy Development Server:
   ```bash
   npm run dev
   ```
   *Frontend sẽ chạy tại địa chỉ:* `http://localhost:3000`

---

## 🛠️ Một số lệnh debug hữu ích

- **Kiểm tra kiểu dữ liệu (TypeScript)**:
  ```bash
  cd frontend
  npx tsc --noEmit
  ```
- **Xóa sạch dữ liệu Database SQLite để test lại**:
  Bạn có thể xóa file `backend/healthchain.db` và khởi động lại backend, hệ thống sẽ tự động khởi tạo lại DB và chạy migration tự động.

Chúc bạn có chuyến đi làm việc hiệu quả và thuận lợi với chiếc laptop của mình! 💻✈️
