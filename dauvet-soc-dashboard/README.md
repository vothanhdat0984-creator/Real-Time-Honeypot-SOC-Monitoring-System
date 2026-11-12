# DẤU VẾT / SOC — Dashboard v3.1 (dễ đọc hơn)

Bản v3.1 sử dụng font **Inter** cho giao diện Việt/Anh và **JetBrains Mono** cho IP/mã sự kiện, nâng cỡ chữ và độ tương phản của các nhãn nhỏ, giữ nguyên bảng màu. Giao diện SOC song ngữ **Việt / English**, đọc dữ liệu từ FastAPI + PostgreSQL + Cowrie. Bản v3 giữ bảng màu xanh navy–teal của bản v2, sử dụng logo biểu tượng trừu tượng, thay khối `81 / 100` bằng **Mức độ giám sát**, và thay thẻ môi trường lab bằng **Trạng thái cảm biến**.

## Điều kiện

- Node.js phù hợp với Vite 7 (Node 20.19+ hoặc 22.12+)
- FastAPI đang chạy trên Ubuntu ở `127.0.0.1:8000`, với các endpoint:
  - `GET /api/trang-thai`
  - `GET /api/tong-quan`
  - `GET /api/su-kien?gioi_han=100`
  - `GET /api/canh-bao?gioi_han=100`
- Ubuntu có `~/soc-api` và PostgreSQL đã chạy

## Cài và chạy

```bash
cd ~/dauvet-soc-dashboard
npm install
npm run build
npm run dev
```

FastAPI chạy riêng ở Ubuntu (`cd ~/soc-api && source ~/soc-venv/bin/activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000`). Vite proxy `/api` sang FastAPI qua `127.0.0.1:8000`; không mở trực tiếp API hay Postgres cho Internet.

Trên Windows, SSH tunnel (giữ PowerShell đang chạy):

```powershell
ssh -N -L 5173:127.0.0.1:5173 ubuntu@192.168.78.130
```

Truy cập `http://127.0.0.1:5173/`.

## Hướng dẫn nâng cấp an toàn từ v2

1. Dừng Vite `Ctrl+C` nếu đang chạy.
2. Trên Ubuntu sao lưu `~/dauvet-soc-dashboard` thành thư mục backup.
3. Sao chép file ZIP v3 lên Ubuntu (qua PowerShell `scp`).
4. Giải nén ZIP vào `/home/ubuntu` (gói có thư mục gốc `dauvet-soc-dashboard/`), đảm bảo không xóa `.env` hay dữ liệu tại `~/soc-postgres`.
5. Trong `~/dauvet-soc-dashboard`, chạy `npm install`, `npm run build`, `npm run dev`.
6. Trình duyệt Windows: `Ctrl + Shift + R` để bỏ cache cũ.

## Ý nghĩa trạng thái

- **API đã kết nối** chỉ phản ánh việc FastAPI trả về trạng thái bình thường, PostgreSQL đã kết nối theo `GET /api/trang-thai`.
- **Cảm biến Cowrie** được hiển thị **Chưa xác minh** vì backend hiện chưa có endpoint/heartbeat kiểm tra tình trạng Cowrie. Không hiển thị Online khi không có bằng chứng.
- **Mức độ giám sát**: `Đang theo dõi` khi API/DB hoạt động nhưng sensor chưa xác minh; `Cần chú ý` nếu có cảnh báo chưa đóng trong tập bản ghi API; `Gián đoạn` nếu API/DB không phản hồi; `Bình thường` chỉ khi backend xác nhận sensor Online và không có cảnh báo đang mở trong dữ liệu trả về. Tất cả số cảnh báo chỉ phản ánh tối đa 100 bản ghi API, không phải toàn bộ lịch sử.
- **Thống kê tổng quan** từ database; **phân bố hoạt động** từ tối đa 100 sự kiện gần nhất. Không giả lập dữ liệu. Khối trống hiển thị thông báo chưa có dữ liệu.
- Các timestamp hiển thị theo `Asia/Ho_Chi_Minh` (UTC+7), giữ bản gốc trong CSV.
- Dashboard làm mới dữ liệu mỗi 5 giây (polling, chưa có WebSocket).
- `public/brand-mark.png` dùng trong sidebar. `public/dauvet-logo-full.png` là logo nguyên mẫu, và `public/icon-192.png` làm icon nhỏ.

## Bảo mật

Chỉ dùng Vite dev qua SSH tunnel trong lab. Trước khi triển khai Internet cần build production, reverse proxy HTTPS, xác thực dashboard, RBAC, API read-only account, CORS thích hợp và kiểm soát truy cập; không công khai PostgreSQL.
