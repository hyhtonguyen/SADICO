# HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG SADICO CMMS 🚀

Tài liệu này hướng dẫn chi tiết từng bước từ cấu hình Database SQL Server đến chạy Backend (ASP.NET Core 9 hoặc Node.js Express) và khởi chạy Giao diện Frontend (React + Vite) của hệ thống **SADICO CMMS** trên môi trường máy tính của bạn (Localhost).

---

## 📌 THÔNG SỐ CẤU HÌNH LIÊN KẾT (YÊU CẦU)
*   **Database Server:** Microsoft SQL Server 2016 trở lên
*   **Địa chỉ Local Server của bạn:** `192.168.1.157,1435`
*   **Tên cơ sở dữ liệu:** `SADICO_P1`
*   **Tài khoản kết nối (SA):** `sa`
*   **Mật khẩu (Password):** `123456`

---

## BƯỚC 1: THIẾT LẬP CƠ SỞ DỮ LIỆU (SQL SERVER)

Bạn cần khởi tạo cấu trúc các bảng và dữ liệu mẫu (Seed Data) chuẩn Sadico vào máy chủ SQL Server của bạn.

1.  Mở ứng dụng **SQL Server Management Studio (SSMS)** hoặc công cụ quản trị tương đương (Azure Data Studio).
2.  Kết nối đến máy chủ SQL của bạn:
    *   **Server name:** `192.168.1.157,1435` (hoặc `localhost,1435` nếu bạn đang chạy trực tiếp trên máy chứa SQL Server).
    *   **Authentication:** SQL Server Authentication.
    *   **Login:** `sa`
    *   **Password:** `123456`
3.  Mở tệp mã nguồn kịch bản SQL có sẵn trong dự án tại đường dẫn:
    👉 **`/src/database/schema.sql`**
4.  Copy toàn bộ nội dung tệp tin này, dán vào một cửa sổ truy vấn mới (**New Query**) trong SSMS.
5.  Nhấn nút **Execute** (hoặc phím **F5**) để chạy.
    *   *Kết quả mong đợi:* Hệ thống sẽ tự động tạo cơ sở dữ liệu `SADICO_P1`, thiết lập toàn bộ các bảng (`Users`, `Devices`, `Parts`, `WorkOrders`, `WorkOrderParts`, `MaterialRequests`, `MaterialRequestItems`, `AuditLogs`) với đầy đủ ràng buộc khóa ngoại và thêm mới dữ liệu mẫu chuẩn hóa để bạn kiểm thử.

---

## BƯỚC 2: CẤU HÌNH & CHẠY BACKEND (CÓ 2 LỰA CHỌN)

Dự án đã được tích hợp đầy đủ cả 2 nền tảng backend: **C# ASP.NET Core 9** (kết nối SQL Server thực tế) và **Node.js Express** (mô phỏng / kết nối linh hoạt). Bạn có thể chọn 1 trong 2 để khởi chạy:

### LỰA CHỌN A: Chạy Backend C# ASP.NET Core 9 (Khuyên dùng)
Đây là backend thực tế kết nối trực tiếp đến SQL Server nội bộ của bạn qua chuỗi kết nối (Connection String).

1.  Cài đặt môi trường máy tính:
    *   Tải và cài đặt **.NET 9.0 SDK** (bản chính thức từ Microsoft).
2.  Kiểm tra cấu hình liên kết trong file:
    👉 **`/backend-csharp/appsettings.json`**
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Server=192.168.1.157,1435;Database=SADICO_P1;User Id=sa;Password=123456;TrustServerCertificate=True;MultipleActiveResultSets=True"
      }
    }
    ```
3.  Mở cửa sổ dòng lệnh (Terminal / Command Prompt) tại thư mục **`/backend-csharp`** của dự án và chạy các lệnh sau:
    ```bash
    # Khôi phục các thư viện NuGet phụ thuộc
    dotnet restore

    # Chạy ứng dụng Web API
    dotnet run
    ```
    *   Ứng dụng sẽ khởi chạy và lắng nghe tại cổng mặc định của .NET (thường là `http://localhost:5000` hoặc `https://localhost:5001`).
    *   Lúc khởi chạy, hệ thống sẽ tự động gọi `context.Database.EnsureCreated()` để xác minh kết nối đến SQL Server `SADICO_P1` trên máy chủ của bạn.

---

### LỰA CHỌN B: Chạy Backend Node.js Express (Giải pháp thay thế nhanh)
Nếu bạn chưa cài .NET SDK và muốn khởi động nhanh bằng Node.js với tệp dữ liệu JSON mô phỏng:

1.  Cài đặt **Node.js LTS** (phiên bản 18 hoặc 20).
2.  Tạo tệp cấu hình **`.env`** ở thư mục gốc của dự án (được sao chép từ `.env.example` đã có sẵn):
    ```env
    PORT=3000
    NODE_ENV=development
    
    # Cấu hình SQL máy chủ của bạn để lưu thông tin tham chiếu
    DB_SERVER="192.168.1.157"
    DB_PORT=1435
    DB_DATABASE="SADICO_P1"
    DB_USER="sa"
    DB_PASSWORD="123456"
    ```
3.  Chạy các dòng lệnh sau ở thư mục gốc của dự án:
    ```bash
    # Cài đặt toàn bộ thư viện cần thiết
    npm install

    # Khởi chạy máy chủ phát triển (Vite + Express)
    npm run dev
    ```

---

## BƯỚC 3: CẤU HÌNH & CHẠY FRONTEND (REACT CLIENT)

Giao diện Web Client được xây dựng bằng React 18, Vite và Tailwind CSS cực kỳ mượt mà.

1.  Nếu bạn đang chạy **Backend C# ASP.NET Core** (chạy trên cổng `http://localhost:5000`):
    *   Hãy cấu hình lại cơ chế Proxy trong tệp **`vite.config.ts`** để chuyển tiếp các cuộc gọi `/api/*` từ React về đúng cổng của C# API.
    *   Thêm cấu hình proxy vào `vite.config.ts` như sau:
        ```typescript
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:5000', // Cổng chạy của ASP.NET Core
              changeOrigin: true,
              secure: false
            }
          }
        }
        ```
2.  Mở cửa sổ dòng lệnh ở thư mục gốc dự án và cài đặt node_modules (nếu chưa làm ở bước trước):
    ```bash
    npm install
    ```
3.  Khởi chạy Frontend React:
    ```bash
    npm run dev
    ```
4.  Mở trình duyệt Web của bạn truy cập địa chỉ hiển thị trên màn hình:
    👉 **`http://localhost:3000`** (hoặc cổng được hiển thị trong log).

---

## BƯỚC 4: HƯỚNG DẪN LẤY API & CẤU HÌNH CÁC DỊCH VỤ LIÊN KẾT

Để hệ thống hoạt động đầy đủ chức năng nâng cao (Tự động hóa AI, Lưu trữ hình ảnh hiện trạng thiết bị):

### 1. Dịch vụ Trí tuệ Nhân tạo (Gemini AI API)
Hệ thống tích hợp AI để tự động phân tích mã lỗi, đề xuất giải pháp sửa chữa và tự động phân loại vật tư dựa trên triệu chứng hỏng hóc.
*   **Cách lấy API Key:**
    1.  Truy cập trang [Google AI Studio](https://aistudio.google.com/).
    2.  Đăng nhập bằng tài khoản Google của bạn.
    3.  Nhấp vào **"Get API Key"** và chọn **"Create API Key"**.
    4.  Copy mã khóa thu được (Dạng `AIzaSy...`).
*   **Cách cấu hình:**
    *   Dán mã API Key đó vào file cấu hình môi trường `.env` ở máy của bạn:
        ```env
        GEMINI_API_KEY="MÃ_API_KEY_CỦA_BẠN_Ở_ĐÂY"
        ```

### 2. Dịch vụ lưu trữ hình ảnh hiện trạng (MinIO S3 / Cloudinary)
Tránh việc lưu trực tiếp chuỗi Base64 cực kỳ nặng vào SQL Server, hệ thống khuyên dùng lưu ảnh hiện trạng hỏng hóc (Trước/Sau khi sửa) lên máy chủ lưu trữ file chuyên biệt.
*   **Cấu hình MinIO (Khuyên dùng cho mạng nội bộ Sadico):**
    *   Chạy container MinIO trên máy chủ `192.168.1.157:9000`.
    *   Tạo Bucket tên là `sadico-cmms-images`.
    *   Cấu hình AccessKey & SecretKey tương ứng vào `appsettings.json` để C# Web API tự động upload và trả về URL ảnh lưu vào SQL Server.
*   **Cấu hình Cloudinary (Dành cho lưu trữ Cloud miễn phí):**
    *   Đăng ký tài khoản miễn phí tại [Cloudinary.com](https://cloudinary.com/).
    *   Lấy các thông số `CloudName`, `ApiKey`, và `ApiSecret` dán vào phần cài đặt môi trường backend để xử lý.

---

## 🏆 CÁC TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH ĐỂ THỬ NGHIỆM
Hệ thống hỗ trợ phân quyền vai trò chặt chẽ (Role-Based Access Control) thông qua giao diện đăng nhập:

| Tên Đăng Nhập | Mật Khẩu | Họ và Tên | Vai Trò & Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **`codien1`** | `sadico123` | Nguyễn Văn Hùng | **Kỹ thuật bảo trì (Cơ điện)**: Gửi yêu cầu bảo trì, cập nhật trạng thái sửa chữa, báo cáo tiêu hao vật tư kho. |
| **`vattu1`** | `sadico123` | Lê Thị Lan | **Bộ phận Vật tư**: Quản lý xuất/nhập kho, cập nhật số lượng tồn kho, phê duyệt mua sắm thiết bị phụ trợ. |
| **`truongca1`** | `sadico123` | Trần Minh Đức | **Trưởng ca**: Tiếp nhận báo cáo lỗi từ nhà máy, phê duyệt lệnh sửa chữa thiết bị khẩn cấp. |
| **`lanhdao1`** | `sadico123` | Phạm Việt Hoàng | **Ban lãnh đạo**: Xem biểu đồ KPI, theo dõi tổng chi phí bảo trì, duyệt mua sắm ngân sách lớn. |

---

*Chúc bạn triển khai và vận hành hệ thống SADICO CMMS thành công! Nếu gặp bất kỳ vấn đề gì về kết nối SQL Server, hãy kiểm tra cài đặt Tường lửa (Firewall) cổng 1435 trên máy chủ 192.168.1.157.*
