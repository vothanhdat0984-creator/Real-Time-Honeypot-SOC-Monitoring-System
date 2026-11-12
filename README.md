# \# 🛡️ DẤU VẾT — Hệ thống Honeypot \& Giám sát An ninh mạng thời gian thực

# 

# \*\*DẤU VẾT (Real-Time Honeypot \& SOC Monitoring System)\*\* là dự án nghiên cứu và xây dựng hệ thống Honeypot kết hợp giám sát an ninh mạng theo mô hình Security Operations Center (SOC).

# 

# Hệ thống sử dụng \*\*Cowrie Honeypot\*\* để mô phỏng dịch vụ SSH, thu thập dữ liệu truy cập từ Internet, phân tích sự kiện bảo mật và trực quan hóa thông tin trên Dashboard SOC.

# 

# Dự án được xây dựng từ môi trường Lab và triển khai thực tế trên \*\*VPS Ubuntu Server\*\*, hướng đến việc nghiên cứu hành vi truy cập đáng ngờ, phát triển kỹ năng phân tích nhật ký và tìm hiểu quy trình vận hành hệ thống giám sát an ninh mạng.

# 

# \---

# 

# \## 📌 1. Giới thiệu dự án

# 

# Trong môi trường Internet, các máy chủ công khai thường xuyên nhận được những kết nối từ công cụ quét tự động, bot và nhiều nguồn truy cập không xác định.

# 

# Đặc biệt, SSH là một trong những dịch vụ thường được kiểm tra nhằm tìm kiếm thông tin hệ thống hoặc thử các thông tin đăng nhập.

# 

# Để nghiên cứu những hoạt động này mà không trực tiếp sử dụng dịch vụ quản trị thật, dự án \*\*DẤU VẾT\*\* triển khai một Honeypot SSH có khả năng ghi nhận các sự kiện tương tác.

# 

# Dữ liệu sau khi thu thập được xử lý, lưu trữ và phân tích thông qua hệ thống SOC Dashboard.

# 

# \### 🎯 Mục tiêu dự án

# 

# \- Xây dựng Honeypot SSH để ghi nhận các hoạt động truy cập thực tế.

# \- Thu thập và xử lý nhật ký sự kiện từ Cowrie.

# \- Lưu trữ dữ liệu bảo mật tập trung bằng PostgreSQL.

# \- Phân tích IP nguồn, phiên SSH, đăng nhập và câu lệnh.

# \- Phát hiện những hành vi đáng ngờ thông qua các quy tắc giám sát.

# \- Xây dựng Dashboard SOC trực quan và hỗ trợ cập nhật dữ liệu gần thời gian thực.

# \- Phân tích vị trí địa lý ước tính của IP công khai.

# \- Triển khai hệ thống trên VPS, quản lý dịch vụ và bảo vệ giao diện giám sát.

# \- Thu thập dữ liệu thực tế để phục vụ phân tích và đánh giá.

# 

# \---

# 

# \## ⚙️ 2. Công nghệ sử dụng

# 

# | Thành phần | Công nghệ |

# |---|---|

# | Hệ điều hành | Ubuntu Server 24.04 LTS |

# | Môi trường kiểm thử | VMware Workstation, Kali Linux |

# | Honeypot | Cowrie SSH Honeypot |

# | Containerization | Docker, Docker Compose |

# | Xử lý và thu thập dữ liệu | Python |

# | Cơ sở dữ liệu | PostgreSQL |

# | Backend API | FastAPI |

# | Frontend | React, JavaScript |

# | Công cụ build frontend | Vite |

# | Web Server | Nginx |

# | Giám sát và quản lý dịch vụ | systemd |

# | GeoIP | MaxMind GeoLite2 |

# | Kết nối HTTPS | Cloudflare Tunnel |

# | Kiểm soát truy cập | Cloudflare Access |

# | Nền tảng triển khai | VPS Ubuntu Server |

# 

# \---

# 

# \## 🏗️ 3. Kiến trúc hệ thống

# 

# DẤU VẾT sử dụng kiến trúc thu thập và phân tích dữ liệu tập trung. Các thành phần được tổ chức thành hai luồng chính.

# 

# \### 3.1. Luồng thu thập và xử lý sự kiện

# 

# ```text

# &#x20;            INTERNET

# &#x20;               |

# &#x20;               v

# &#x20;      +------------------+

# &#x20;      | COWRIE HONEYPOT  |

# &#x20;      |   SSH Service    |

# &#x20;      +------------------+

# &#x20;               |

# &#x20;               | JSON Events

# &#x20;               v

# &#x20;      +------------------+

# &#x20;      | PYTHON COLLECTOR |

# &#x20;      |  Event Processor |

# &#x20;      +------------------+

# &#x20;               |

# &#x20;               v

# &#x20;      +------------------+

# &#x20;      |    POSTGRESQL    |

# &#x20;      |  Security Events |

# &#x20;      |  Security Alerts |

# &#x20;      +------------------+

# &#x20;               |

# &#x20;               v

# &#x20;      +------------------+

# &#x20;      |   FASTAPI API    |

# &#x20;      | Analytics / GeoIP|

# &#x20;      +------------------+

# &#x20;               |

# &#x20;               v

# &#x20;      +------------------+

# &#x20;      |  SOC DASHBOARD   |

# &#x20;      |    React/Vite    |

# &#x20;      +------------------+

# ```

# 

# \*\*Vai trò của các thành phần:\*\*

# 

# \- \*\*Cowrie Honeypot:\*\* Mô phỏng dịch vụ SSH, tiếp nhận kết nối và ghi nhận hoạt động tương tác.

# \- \*\*Python Collector:\*\* Đọc nhật ký JSON, xử lý sự kiện, hạn chế lưu trùng và chuyển dữ liệu vào PostgreSQL.

# \- \*\*PostgreSQL:\*\* Lưu trữ sự kiện bảo mật và các cảnh báo được tạo bởi hệ thống.

# \- \*\*FastAPI:\*\* Cung cấp API truy vấn, tổng hợp, phân tích và phục vụ dữ liệu cho Dashboard.

# \- \*\*React Dashboard:\*\* Hiển thị biểu đồ, thống kê, danh sách sự kiện và trạng thái các thành phần.

# \- \*\*GeoLite2:\*\* Tra cứu quốc gia ước tính của IP công khai từ cơ sở dữ liệu địa lý cục bộ.

# 

# \### 3.2. Luồng truy cập Dashboard

# 

# ```text

# &#x20;        NGƯỜI DÙNG

# &#x20;             |

# &#x20;             v

# &#x20;    +-------------------+

# &#x20;    | CLOUDFLARE ACCESS |

# &#x20;    |   Authentication  |

# &#x20;    +-------------------+

# &#x20;             |

# &#x20;             v

# &#x20;    +-------------------+

# &#x20;    | CLOUDFLARE TUNNEL |

# &#x20;    |   HTTPS Routing   |

# &#x20;    +-------------------+

# &#x20;             |

# &#x20;             v

# &#x20;    +-------------------+

# &#x20;    |       NGINX       |

# &#x20;    | Static / API Proxy|

# &#x20;    +-------------------+

# &#x20;         |         |

# &#x20;         v         v

# &#x20;      REACT      FASTAPI

# &#x20;      DASHBOARD     |

# &#x20;                    v

# &#x20;                POSTGRESQL

# ```

# 

# Dashboard được bảo vệ bởi Cloudflare Access để giới hạn người dùng được phép truy cập. Backend và cơ sở dữ liệu được cấu hình phục vụ nội bộ, hạn chế công khai các cổng không cần thiết.

# 

# \---

# 

# \## 🚀 4. Chức năng chính

# 

# \### 4.1. Giám sát Honeypot SSH

# 

# Hệ thống thu thập và theo dõi các hoạt động tương tác với Cowrie, bao gồm:

# 

# \- Kết nối SSH đến Honeypot.

# \- Thông tin IP nguồn và thời gian kết nối.

# \- Các sự kiện thử đăng nhập.

# \- Thông tin phiên SSH.

# \- Sự kiện nhận diện SSH client và trao đổi giao thức.

# \- Những câu lệnh được Honeypot ghi nhận.

# \- Trạng thái kết thúc phiên kết nối.

# 

# Các sự kiện được lưu trữ để hỗ trợ phân tích lịch sử hoạt động.

# 

# \### 4.2. Phân tích sự kiện bảo mật

# 

# Hệ thống cung cấp các chức năng:

# 

# \- Thống kê tổng số sự kiện.

# \- Đếm số lượng IP nguồn.

# \- Thống kê đăng nhập thất bại.

# \- Tổng hợp sự kiện theo loại `event\_id`.

# \- Theo dõi số lượng sự kiện theo khoảng thời gian.

# \- Xếp hạng IP nguồn theo số lượng sự kiện.

# \- Phân tích hành vi theo phiên SSH.

# \- Tạo cảnh báo theo các quy tắc phát hiện được cấu hình.

# 

# Một số loại sự kiện thường gặp:

# 

# ```text

# cowrie.session.connect

# cowrie.client.version

# cowrie.client.kex

# cowrie.login.failed

# cowrie.login.success

# cowrie.command.input

# cowrie.session.closed

# ```

# 

# Các loại sự kiện xuất hiện phụ thuộc vào hành vi tương tác thực tế với Honeypot.

# 

# \### 4.3. Phân tích địa lý IP — GeoIP

# 

# DẤU VẾT tích hợp \*\*MaxMind GeoLite2 Country\*\* nhằm ước tính quốc gia của địa chỉ IP công khai.

# 

# Chức năng bao gồm:

# 

# \- Xác định mã quốc gia của IP nguồn.

# \- Hiển thị tên quốc gia bằng tiếng Việt hoặc tiếng Anh.

# \- Thống kê số lượng sự kiện theo quốc gia.

# \- Phân biệt IP công khai và IP thuộc mạng nội bộ.

# \- Hiển thị trạng thái hoạt động của cơ sở dữ liệu GeoIP.

# 

# \*\*Lưu ý:\*\* GeoIP chỉ cung cấp thông tin ước tính. Quốc gia của địa chỉ IP không nhất thiết phản ánh vị trí thực tế hoặc danh tính của người thực hiện kết nối.

# 

# \### 4.4. Dashboard SOC

# 

# Dashboard được thiết kế theo phong cách \*\*Modern Security\*\*, sử dụng giao diện tối và trực quan hóa các chỉ số an ninh mạng.

# 

# Các chức năng nổi bật:

# 

# \- Hiển thị tổng quan tình trạng hệ thống.

# \- Theo dõi sự kiện Honeypot.

# \- Biểu đồ hoạt động theo thời gian.

# \- Thống kê IP nguồn nổi bật.

# \- Phân bố địa lý theo quốc gia.

# \- Danh sách phiên SSH.

# \- Danh sách câu lệnh được ghi nhận.

# \- Thống kê và theo dõi cảnh báo bảo mật.

# \- Theo dõi trạng thái Honeypot, Collector, API và cơ sở dữ liệu.

# \- Lọc dữ liệu theo khoảng thời gian.

# \- Hỗ trợ tiếng Việt và tiếng Anh.

# \- Hiển thị thời gian theo múi giờ Việt Nam (UTC+7).

# \- Tương thích với máy tính, máy tính bảng và điện thoại.

# 

# Dữ liệu hiển thị trên Dashboard được cung cấp thông qua FastAPI và truy vấn từ PostgreSQL.

# 

# \---

# 

# \## 📂 5. Cấu trúc mã nguồn

# 

# Các thành phần chính của repository được tổ chức như sau:

# 

# ```text

# DAU-VET-SOC/

# │

# ├── soc-api/

# │   ├── main.py

# │   └── soc\_extension.py

# │

# ├── dauvet-soc-dashboard/

# │   ├── public/

# │   │

# │   ├── src/

# │   │   ├── App.jsx

# │   │   ├── SOCInsights.jsx

# │   │   ├── styles.css

# │   │   └── ...

# │   │

# │   ├── package.json

# │   └── ...

# │

# ├── soc\_db\_collector.py

# │

# ├── .gitignore

# └── README.md

# ```

# 

# \*\*Mô tả:\*\*

# 

# | Thành phần | Chức năng |

# |---|---|

# | `soc-api/main.py` | Backend FastAPI chính |

# | `soc-api/soc\_extension.py` | API phân tích SOC, GeoIP và trạng thái hệ thống |

# | `dauvet-soc-dashboard/` | Mã nguồn giao diện Dashboard |

# | `src/SOCInsights.jsx` | Thành phần hiển thị thống kê và phân tích SOC |

# | `src/styles.css` | Định dạng và thiết kế giao diện |

# | `soc\_db\_collector.py` | Thu thập và xử lý nhật ký Cowrie |

# | `.gitignore` | Loại trừ tệp không cần thiết và dữ liệu nhạy cảm |

# | `README.md` | Tài liệu giới thiệu dự án |

# 

# \*Cây thư mục chỉ trình bày các thành phần tiêu biểu; danh sách tệp thực tế có thể khác tùy phiên bản mã nguồn.\*

# 

# \---

# 

# \## 🖥️ 6. Quá trình triển khai

# 

# Dự án được xây dựng qua hai giai đoạn chính.

# 

# \### Giai đoạn 1 — Xây dựng và kiểm thử trong môi trường Lab

# 

# \*\*Môi trường:\*\* VMware Workstation, Ubuntu Server và Kali Linux.

# 

# Trong giai đoạn này:

# 

# 1\. Khởi tạo máy ảo Ubuntu Server và Kali Linux.

# 2\. Thiết lập mạng Lab để hai máy có thể giao tiếp.

# 3\. Cài đặt Docker và triển khai Cowrie Honeypot.

# 4\. Sử dụng Kali Linux để mô phỏng các hoạt động kết nối SSH.

# 5\. Kiểm tra nhật ký sự kiện Cowrie.

# 6\. Phát triển Python Collector để xử lý dữ liệu JSON.

# 7\. Tích hợp PostgreSQL để lưu trữ sự kiện.

# 8\. Xây dựng FastAPI và Dashboard giám sát.

# 9\. Kiểm thử khả năng thu thập, xử lý và hiển thị dữ liệu.

# 

# Mục tiêu của giai đoạn Lab là xác nhận các thành phần có thể phối hợp hoạt động trước khi đưa hệ thống lên Internet.

# 

# \### Giai đoạn 2 — Triển khai trên VPS thực tế

# 

# \*\*Môi trường:\*\* VPS Ubuntu Server 24.04 LTS.

# 

# Các công việc chính:

# 

# 1\. Cài đặt và cấu hình môi trường VPS.

# 2\. Thiết lập SSH Key và tường lửa cho việc quản trị.

# 3\. Triển khai Cowrie Honeypot bằng Docker.

# 4\. Triển khai PostgreSQL bằng Docker.

# 5\. Chuyển mã nguồn Collector và FastAPI lên VPS.

# 6\. Cấu hình các dịch vụ tự khởi động bằng systemd.

# 7\. Build Dashboard React để phục vụ bằng Nginx.

# 8\. Cấu hình Cloudflare Tunnel và Cloudflare Access.

# 9\. Tích hợp GeoLite2 để phân tích quốc gia của IP nguồn.

# 10\. Kiểm tra trạng thái hệ thống và khả năng tiếp nhận sự kiện từ Internet.

# 

# Sau khi triển khai, hệ thống có thể hoạt động độc lập trên VPS, không phụ thuộc vào máy tính cá nhân hoặc các máy ảo trong môi trường Lab.

# 

# \---

# 

# \## 📊 7. Thu thập và phân tích dữ liệu thực tế

# 

# Dự án dự kiến vận hành Honeypot trên VPS trong khoảng \*\*7 ngày\*\* để thu thập các kết nối và sự kiện SSH thực tế từ Internet.

# 

# \### Nội dung theo dõi

# 

# \- Tổng số sự kiện được ghi nhận.

# \- Số lượng IP nguồn khác nhau.

# \- Quốc gia ước tính của các IP công khai.

# \- Phân bố hoạt động theo thời gian.

# \- Các loại sự kiện xuất hiện thường xuyên.

# \- Số lượng phiên SSH.

# \- Những lần thử đăng nhập.

# \- Các câu lệnh được ghi nhận.

# \- Cảnh báo từ hệ thống giám sát.

# 

# \### Phương pháp đánh giá

# 

# Dữ liệu được phân tích dựa trên nhật ký Cowrie và các thống kê lưu trữ trong PostgreSQL.

# 

# Các kết nối được phân loại theo đặc điểm sự kiện và hành vi quan sát được. Không mặc định mọi kết nối đến Honeypot đều là một cuộc tấn công có chủ đích.

# 

# \### Kết quả thực nghiệm

# 

# Kết quả tổng hợp sẽ được cập nhật sau khi hoàn thành đợt thu thập dữ liệu, bao gồm:

# 

# \- Thống kê tổng quan.

# \- Phân tích nguồn truy cập.

# \- Phân tích hoạt động theo thời gian.

# \- Một số sự kiện đáng chú ý.

# \- Đánh giá khả năng giám sát của hệ thống.

# \- Những hạn chế và hướng cải tiến.

# 

# Dữ liệu thô chứa thông tin nhạy cảm sẽ không được công khai trong repository.

# 

# \---

# 

# \## 🔐 8. Các biện pháp bảo mật

# 

# Do Honeypot được triển khai trên môi trường Internet, dự án chú trọng việc giới hạn phạm vi truy cập và bảo vệ các thành phần quản trị.

# 

# \### Bảo vệ VPS

# 

# \- Sử dụng SSH Key để quản trị máy chủ.

# \- Cấu hình tường lửa hạn chế các cổng không cần thiết.

# \- Tách biệt SSH quản trị thật với dịch vụ SSH mô phỏng của Cowrie.

# \- Giới hạn quyền của container Honeypot.

# \- Theo dõi trạng thái và tài nguyên hệ thống.

# 

# \### Bảo vệ backend và cơ sở dữ liệu

# 

# \- PostgreSQL không được công khai trực tiếp ra Internet.

# \- FastAPI chỉ lắng nghe trên giao diện mạng nội bộ.

# \- Dashboard truy cập API thông qua Nginx reverse proxy.

# \- Thông tin xác thực được tách khỏi mã nguồn.

# \- Các dịch vụ được quản lý và giám sát bằng systemd.

# 

# \### Bảo vệ Dashboard

# 

# \- Sử dụng HTTPS thông qua Cloudflare Tunnel.

# \- Giới hạn người dùng bằng Cloudflare Access.

# \- Không yêu cầu công khai cổng quản trị Dashboard trên VPS.

# \- Chỉ cấp quyền xem Dashboard cho những tài khoản được cho phép.

# 

# \### Bảo vệ mã nguồn

# 

# Repository không bao gồm:

# 

# \- Mật khẩu cơ sở dữ liệu.

# \- SSH Private Key.

# \- Cloudflare Tunnel Token.

# \- MaxMind License Key.

# \- File cấu hình chứa thông tin bí mật.

# \- Bản sao lưu PostgreSQL.

# \- Nhật ký tấn công thô chứa dữ liệu nhạy cảm.

# 

# \---

# 

# \## 🧪 9. API và các chức năng phân tích

# 

# Backend sử dụng FastAPI để cung cấp dữ liệu và các chức năng phân tích cho Dashboard.

# 

# Một số endpoint chính:

# 

# | Endpoint | Chức năng |

# |---|---|

# | `/api/trang-thai` | Kiểm tra trạng thái API và kết nối cơ sở dữ liệu |

# | `/api/tong-quan` | Truy vấn thống kê tổng quan |

# | `/api/soc/phan-tich` | Tổng hợp sự kiện, IP nguồn và hoạt động theo thời gian |

# | `/api/soc/phien` | Phân tích các phiên SSH |

# | `/api/soc/geo` | Kiểm tra thông tin GeoIP |

# | `/api/soc/suc-khoe` | Kiểm tra trạng thái các thành phần |

# | `/api/soc/lenh` | Truy vấn các câu lệnh Cowrie được ghi nhận |

# 

# Các endpoint được thiết kế phục vụ Dashboard và không yêu cầu công khai trực tiếp dịch vụ backend ra Internet.

# 

# \---

# 

# \## 📷 10. Minh chứng hoạt động

# 

# Minh chứng của dự án được xây dựng từ quá trình triển khai và thu thập dữ liệu thực tế.

# 

# Các nội dung dự kiến bổ sung:

# 

# \- Ảnh giao diện tổng quan Dashboard SOC.

# \- Biểu đồ thống kê sự kiện.

# \- Bảng nguồn truy cập nổi bật.

# \- Phân bố địa lý IP nguồn.

# \- Danh sách phiên SSH.

# \- Thống kê cảnh báo bảo mật.

# \- Sơ đồ kiến trúc hệ thống.

# 

# Ảnh minh chứng và dữ liệu thống kê sẽ được kiểm tra, ẩn thông tin nhạy cảm trước khi công khai.

# 

# \---

# 

# \## 📈 11. Hướng phát triển

# 

# DẤU VẾT có thể tiếp tục mở rộng theo các hướng sau:

# 

# \### Nâng cao khả năng phát hiện

# 

# \- Xây dựng thêm các quy tắc nhận diện hành vi bất thường.

# \- Phân tích tần suất và chuỗi sự kiện theo từng IP.

# \- Phát hiện những hành vi thử đăng nhập liên tiếp.

# \- Phân loại cảnh báo theo mức độ nghiêm trọng.

# 

# \### Mở rộng Honeypot

# 

# \- Nghiên cứu bổ sung Honeypot HTTP.

# \- Theo dõi nhiều loại dịch vụ hơn SSH.

# \- Tập trung dữ liệu từ nhiều cảm biến Honeypot.

# 

# \### Phân tích và báo cáo

# 

# \- Xây dựng báo cáo an ninh định kỳ.

# \- Xuất dữ liệu thống kê phục vụ nghiên cứu.

# \- Bổ sung biểu đồ xu hướng và so sánh theo thời gian.

# \- Nghiên cứu tích hợp các nguồn Threat Intelligence phù hợp.

# 

# \### Tối ưu triển khai

# 

# \- Hoàn thiện cấu hình triển khai tự động.

# \- Cải thiện giám sát tài nguyên VPS.

# \- Bổ sung chính sách lưu trữ và sao lưu dữ liệu.

# \- Tăng cường các biện pháp bảo vệ và cô lập Honeypot.

# 

# \---

# 

# \## ⚠️ 12. Phạm vi và lưu ý sử dụng

# 

# Dự án được phát triển nhằm phục vụ mục đích \*\*học tập, nghiên cứu An toàn thông tin và tìm hiểu hoạt động giám sát an ninh mạng\*\*.

# 

# Honeypot là môi trường mô phỏng dùng để quan sát và ghi nhận tương tác, không phải hệ thống sản xuất cung cấp dịch vụ SSH cho người dùng thông thường.

# 

# Những dữ liệu được thu thập cần được diễn giải thận trọng:

# 

# \- Không phải mọi kết nối đều là hành vi tấn công.

# \- Địa chỉ IP không xác định trực tiếp danh tính của người kết nối.

# \- Thông tin GeoIP chỉ là ước tính.

# \- Dữ liệu quan sát được phụ thuộc vào thời gian triển khai, cấu hình Honeypot và lưu lượng Internet.

# 

# Repository chủ yếu phục vụ mục đích tham khảo kiến trúc và mã nguồn. Việc triển khai trên môi trường khác cần cấu hình riêng các dịch vụ, biến môi trường và biện pháp bảo mật phù hợp.

# 

# \---

# 

# \## 🙏 13. Ghi công

# 

# Dự án sử dụng và tích hợp các công nghệ mã nguồn mở cùng những công cụ phục vụ giám sát an ninh mạng.

# 

# \- \*\*Cowrie:\*\* SSH/Telnet Honeypot — https://github.com/cowrie/cowrie

# \- \*\*FastAPI:\*\* Python Web Framework — https://fastapi.tiangolo.com/

# \- \*\*PostgreSQL:\*\* Relational Database — https://www.postgresql.org/

# \- \*\*React:\*\* Frontend Library — https://react.dev/

# \- \*\*Docker:\*\* Container Platform — https://www.docker.com/

# \- \*\*Cloudflare:\*\* Connectivity and Access Services — https://www.cloudflare.com/

# 

# \*\*GeoIP attribution:\*\*

# 

# This product includes GeoLite2 data created by MaxMind, available from https://www.maxmind.com.

# 

# \---

# 

# \### 🛡️ DẤU VẾT

# 

# \*Thu thập dấu vết — Phân tích hành vi — Nâng cao nhận thức an ninh mạng.\*

# 

# \*\*Real-Time Honeypot \& SOC Monitoring System\*\*

# 

# Dự án nghiên cứu và thực hành trong lĩnh vực \*\*An toàn thông tin (Information Security)\*\*.

