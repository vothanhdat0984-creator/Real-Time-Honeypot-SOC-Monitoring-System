# DẤU VẾT — Real-Time Honeypot & SOC Monitoring System

**DẤU VẾT** là dự án thực hành An toàn thông tin, xây dựng hệ thống **Honeypot SSH** kết hợp **SOC Dashboard** để ghi nhận, lưu trữ và phân tích các kết nối đến máy chủ giả lập. Dự án được phát triển trong môi trường VMware, sau đó triển khai trên VPS Ubuntu để quan sát lưu lượng thực tế từ Internet.

> **Phạm vi:** Dự án phục vụ học tập và nghiên cứu. Dashboard được vận hành trong thời gian thu thập dữ liệu khoảng 7 ngày, không cung cấp đường dẫn truy cập công khai lâu dài.

## Tổng quan chức năng

- **Thu thập sự kiện SSH:** Ghi nhận kết nối, phiên làm việc, thử đăng nhập và câu lệnh nếu Cowrie quan sát được.
- **Phân tích SOC:** Thống kê sự kiện, IP nguồn, loại sự kiện, phiên SSH và cảnh báo theo quy tắc.
- **Phân tích GeoIP:** Ước tính quốc gia của IP công khai bằng cơ sở dữ liệu GeoLite2 cục bộ.
- **Giám sát hệ thống:** Theo dõi trạng thái Honeypot, Collector, API và cơ sở dữ liệu.
- **Dashboard:** Giao diện responsive, hỗ trợ tiếng Việt/tiếng Anh, hiển thị thời gian theo múi giờ Việt Nam (UTC+7).

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Honeypot SSH | Cowrie, Docker |
| Thu thập và xử lý sự kiện | Python |
| Cơ sở dữ liệu | PostgreSQL |
| Backend | FastAPI |
| Frontend | React, Vite, JavaScript |
| Web server | Nginx |
| GeoIP | MaxMind GeoLite2 Country |
| Quản lý dịch vụ | systemd |
| Truy cập Dashboard | Cloudflare Tunnel, Cloudflare Access |
| Hạ tầng | Ubuntu Server 24.04 LTS (VPS) |

## Kiến trúc hệ thống

Luồng thu thập và xử lý dữ liệu:

```text
Internet / SSH clients
         |
         v
   Cowrie Honeypot
         |
         v
   Cowrie JSON logs
         |
         v
   Python Collector
         |
         v
      PostgreSQL
         |
         v
    FastAPI (SOC)
         |
         v
 React SOC Dashboard
```

Luồng truy cập giao diện: **Trình duyệt → Cloudflare Access → Cloudflare Tunnel → Nginx → Dashboard / FastAPI**.

Các dịch vụ FastAPI và PostgreSQL được giới hạn truy cập nội bộ trên VPS; SSH quản trị được tách khỏi cổng SSH giả lập của Cowrie.

## Cấu trúc mã nguồn

```text
DAU-VET-SOC/
├── soc-api/
│   ├── main.py                 # API chính
│   └── soc_extension.py        # Phân tích SOC, GeoIP, trạng thái hệ thống
├── dauvet-soc-dashboard/
│   ├── public/                 # Hình ảnh và tài nguyên tĩnh
│   ├── src/
│   │   ├── App.jsx             # Giao diện chính
│   │   ├── SOCInsights.jsx     # Thống kê và phân tích
│   │   ├── main.jsx            # Điểm khởi chạy ứng dụng
│   │   └── styles.css          # Giao diện và responsive
│   ├── package.json
│   └── vite.config.js
├── soc_db_collector.py         # Đọc và xử lý sự kiện Cowrie
├── .gitignore                  # Loại trừ tệp không công khai
└── README.md
```

*Cây thư mục chỉ hiển thị các tệp chính; một số tệp phụ được lược bỏ.*

## Quá trình triển khai

**Giai đoạn 1 — Lab nội bộ**

Sử dụng Ubuntu Server và Kali Linux trên VMware để kiểm tra mạng, mô phỏng kết nối SSH, đọc nhật ký Cowrie và xây dựng luồng xử lý **Collector → PostgreSQL → FastAPI → Dashboard**.

**Giai đoạn 2 — VPS thực tế**

Triển khai Cowrie và PostgreSQL bằng Docker trên Ubuntu Server; chạy Collector và FastAPI bằng systemd, phục vụ giao diện React qua Nginx. Cloudflare Tunnel và Access được sử dụng để giới hạn quyền truy cập Dashboard.

**Giai đoạn 3 — Thu thập và đánh giá**

Hệ thống dự kiến thu thập dữ liệu trong khoảng **7 ngày**. Sau đợt vận hành, kết quả sẽ được tổng hợp từ các sự kiện đã ghi nhận và trình bày dưới dạng báo cáo, biểu đồ và ảnh chụp Dashboard (đã xử lý thông tin nhạy cảm).

## Các API phân tích chính

| Endpoint | Mục đích |
| --- | --- |
| `/api/trang-thai` | Kiểm tra API và kết nối cơ sở dữ liệu |
| `/api/tong-quan` | Thống kê tổng quan |
| `/api/soc/phan-tich` | Phân tích sự kiện, nguồn IP và quốc gia |
| `/api/soc/phien` | Tổng hợp phiên SSH |
| `/api/soc/lenh` | Danh sách câu lệnh được ghi nhận |
| `/api/soc/suc-khoe` | Trạng thái các thành phần hệ thống |

## Bảo mật và lưu ý

- Không công khai mật khẩu, `.env`, SSH private key, token Cloudflare, cơ sở dữ liệu GeoLite2 hoặc bản sao lưu/log thô có thông tin nhạy cảm.
- Cowrie là dịch vụ giả lập; dữ liệu ghi nhận được dùng để nghiên cứu và phân tích, **không mặc định mọi kết nối đều là tấn công**.
- GeoIP chỉ cung cấp quốc gia **ước tính** của IP công khai, không xác định danh tính hay vị trí chính xác của người kết nối.
- Repository lưu mã nguồn và tài liệu; muốn triển khai lại cần cấu hình môi trường, quyền truy cập và các dịch vụ tương ứng.

## Định hướng phát triển

Hoàn thiện báo cáo thực nghiệm, nâng cao quy tắc phát hiện hành vi bất thường, tự động hóa triển khai và nghiên cứu mở rộng sang các loại Honeypot khác.

## Ghi công

Dự án sử dụng [Cowrie](https://github.com/cowrie/cowrie), [FastAPI](https://fastapi.tiangolo.com/), [PostgreSQL](https://www.postgresql.org/), [React](https://react.dev/) và [Cloudflare](https://www.cloudflare.com/).

*This product includes GeoLite2 data created by MaxMind, available from [maxmind.com](https://www.maxmind.com/).*

---

**DẤU VẾT** — Thu thập dấu vết, phân tích hành vi, nâng cao nhận thức an ninh mạng.
