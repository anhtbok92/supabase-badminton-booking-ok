# Admin User Guide - Subscription Management

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Quản lý gói đăng ký](#quản-lý-gói-đăng-ký)
3. [Gán gói cho câu lạc bộ](#gán-gói-cho-câu-lạc-bộ)
4. [Theo dõi usage và overage](#theo-dõi-usage-và-overage)
5. [Dashboard và báo cáo](#dashboard-và-báo-cáo)
6. [Xử lý các tình huống thường gặp](#xử-lý-các-tình-huống-thường-gặp)

---

## Tổng quan

Hệ thống subscription management cho phép bạn:
- Cấu hình các gói đăng ký với giới hạn tài nguyên
- Gán gói cho câu lạc bộ và theo dõi usage
- Tính phí vượt mức tự động
- Xem báo cáo doanh thu và thống kê

### Truy cập Admin Panel

1. Đăng nhập với tài khoản admin
2. Vào menu **Admin Dashboard**
3. Chọn **Quản lý gói đăng ký** hoặc **Thống kê doanh thu**

---

## Quản lý gói đăng ký

### Xem danh sách gói

1. Vào **Admin Dashboard** → **Quản lý gói đăng ký**
2. Bảng hiển thị tất cả các gói với thông tin:
   - Tên gói (FREE, BASIC, PRO)
   - Giới hạn số sân
   - Giới hạn booking/tháng
   - Giá tháng và giá năm
   - Phí vượt mức
   - Trạng thái (Active/Inactive)

### Tạo gói mới

1. Click nút **Tạo gói mới**
2. Điền thông tin:
   - **Tên gói** (ví dụ: PREMIUM)
   - **Tên hiển thị** (ví dụ: Gói Cao cấp)
   - **Số sân tối đa** (ví dụ: 50)
   - **Số booking/tháng** (ví dụ: 5000)
   - **Giá tháng** (VND)
   - **Giá năm** (VND, thường giảm 10-20%)
   - **Phí vượt mức** (VND/booking)
3. Click **Lưu**

**Lưu ý:**
- Tên gói phải unique (không trùng)
- Giá năm nên thấp hơn giá tháng × 12 để khuyến khích đăng ký dài hạn
- Phí vượt mức nên thấp hơn với gói cao hơn

### Chỉnh sửa gói

1. Click icon **Edit** (✏️) ở gói cần sửa
2. Cập nhật thông tin
3. Click **Lưu**

**Quan trọng:**
- Thay đổi chỉ áp dụng cho subscription mới
- Subscription đang active giữ nguyên cấu hình cũ
- Điều này đảm bảo không ảnh hưởng đến khách hàng hiện tại

### Xóa gói

1. Click icon **Delete** (🗑️) ở gói cần xóa
2. Xác nhận xóa

**Lưu ý:**
- Không thể xóa gói đang có club sử dụng
- Phải chuyển tất cả club sang gói khác trước
- Gói FREE không thể xóa (gói mặc định)

### Vô hiệu hóa gói

Nếu muốn ngừng cung cấp gói nhưng giữ lại cho club hiện tại:
1. Edit gói
2. Bỏ tick **Active**
3. Lưu

Gói inactive:
- Không hiển thị khi gán gói mới
- Club hiện tại vẫn dùng bình thường
- Có thể kích hoạt lại sau

---

## Gán gói cho câu lạc bộ

### Xem subscription hiện tại

1. Vào **Admin Dashboard** → **Quản lý câu lạc bộ**
2. Cột **Subscription** hiển thị:
   - Tên gói hiện tại
   - Ngày hết hạn
   - Badge trạng thái:
     - 🟢 **Active** - Đang hoạt động bình thường
     - 🟡 **Expiring Soon** - Còn < 7 ngày
     - 🔴 **Expired** - Đã hết hạn

### Gán gói mới cho club

1. Vào **Quản lý câu lạc bộ**
2. Click **Assign Subscription** ở club cần gán
3. Chọn thông tin:
   - **Gói đăng ký** (FREE, BASIC, PRO)
   - **Chu kỳ thanh toán**:
     - Monthly (tháng) - Tính theo giá tháng
     - Yearly (năm) - Tính theo giá năm
   - **Ngày bắt đầu** (mặc định: hôm nay)
   - **Auto-renew** (tự động gia hạn)
4. Hệ thống tự động tính ngày hết hạn
5. Click **Gán gói**

**Kết quả:**
- Subscription cũ (nếu có) sẽ bị deactivate
- Subscription mới được tạo và active
- Club có thể sử dụng ngay với giới hạn mới

### Nâng cấp/Hạ cấp gói

**Nâng cấp (Upgrade):**
1. Gán gói cao hơn cho club
2. Giới hạn tăng ngay lập tức
3. Club có thể tạo thêm sân/booking

**Hạ cấp (Downgrade):**
1. Gán gói thấp hơn cho club
2. Giới hạn giảm ngay
3. Nếu club đang vượt giới hạn mới:
   - Sân hiện tại: Giữ nguyên, không tạo thêm được
   - Booking: Vẫn cho phép, tính overage

**Ví dụ:**
- Club có 15 sân với gói PRO (max 30)
- Downgrade về BASIC (max 10)
- 15 sân hiện tại vẫn hoạt động
- Không tạo thêm sân mới cho đến khi < 10

### Gia hạn subscription

**Cách 1: Gán lại cùng gói**
1. Assign subscription với cùng gói
2. Đặt ngày bắt đầu = ngày hết hạn cũ
3. Subscription mới nối tiếp

**Cách 2: Auto-renew**
- Tick **Auto-renew** khi gán gói
- Hệ thống tự động gia hạn khi hết hạn
- (Tính năng này cần tích hợp payment gateway)

### Hủy subscription

1. Gán gói FREE cho club
2. Hoặc để subscription hết hạn tự nhiên
3. Hệ thống tự động downgrade về FREE

---

## Theo dõi usage và overage

### Xem usage của club

**Cách 1: Trong Club Manager**
1. Vào **Quản lý câu lạc bộ**
2. Cột **Usage** hiển thị:
   - Số sân: `5/10 sân`
   - Booking tháng này: `450/1000 bookings`
   - % sử dụng với màu sắc:
     - Xanh: < 80%
     - Vàng: 80-99%
     - Đỏ: ≥ 100% (overage)

**Cách 2: Trong Subscription Dashboard**
1. Vào **Thống kê doanh thu**
2. Tab **Usage Statistics**
3. Xem chi tiết từng club

### Hiểu về overage

**Overage là gì?**
- Khi club vượt quota booking trong tháng
- Chỉ áp dụng với gói BASIC và PRO
- Gói FREE: Block booking khi hết quota

**Cách tính:**
```
Overage Count = Actual Bookings - Max Allowed
Overage Fee = Overage Count × Overage Fee Per Booking

Ví dụ:
- Gói BASIC: 1000 bookings/tháng, phí 2000đ/booking
- Club tạo 1050 bookings
- Overage = 50 bookings
- Phí = 50 × 2000đ = 100,000đ
```

### Xem báo cáo overage

1. Vào **Thống kê doanh thu**
2. Tab **Overage Report**
3. Chọn tháng cần xem
4. Bảng hiển thị:
   - Tên club
   - Gói đăng ký
   - Quota
   - Actual bookings
   - Overage count
   - Overage fee
5. Tổng doanh thu overage ở cuối bảng

### Export báo cáo

1. Click **Export CSV** trong Overage Report
2. File CSV tải về với đầy đủ thông tin
3. Dùng để:
   - Gửi invoice cho club
   - Báo cáo tài chính
   - Phân tích xu hướng

---

## Dashboard và báo cáo

### Subscription Dashboard

Vào **Admin Dashboard** → **Thống kê doanh thu**

#### 1. Revenue Overview

**MRR (Monthly Recurring Revenue):**
- Tổng doanh thu định kỳ hàng tháng
- Tính từ tất cả subscription active
- Subscription yearly được chia cho 12

**ARR (Annual Recurring Revenue):**
- Tổng doanh thu định kỳ hàng năm
- ARR = MRR × 12

**Total Overage Revenue:**
- Tổng doanh thu từ phí vượt mức
- Tính theo tháng hiện tại

**Ví dụ:**
```
- 10 clubs gói BASIC (200k/tháng) = 2,000,000đ
- 5 clubs gói PRO (500k/tháng) = 2,500,000đ
- MRR = 4,500,000đ
- ARR = 54,000,000đ
- Overage tháng này = 500,000đ
```

#### 2. Club Distribution

Biểu đồ tròn (Pie Chart) hiển thị:
- Số lượng club theo từng gói
- % phân bố
- Màu sắc riêng cho mỗi gói

**Phân tích:**
- Nếu quá nhiều FREE → Cần chiến lược upsell
- Nếu ít PRO → Xem xét giảm giá hoặc thêm tính năng
- Phân bố đều → Pricing hợp lý

#### 3. Usage Statistics

**Average Bookings per Club:**
- Trung bình booking/club theo từng gói
- Giúp đánh giá mức độ sử dụng

**Total Bookings:**
- Tổng số booking trên toàn hệ thống
- Theo tháng

**Supabase Usage Estimation:**
- Ước tính chi phí Supabase
- Dựa trên storage và bandwidth
- Cảnh báo khi gần hết free tier

#### 4. Overage Report

Xem chi tiết ở phần [Theo dõi usage và overage](#theo-dõi-usage-và-overage)

### Email Reports

Hệ thống tự động gửi email báo cáo:

**1. Monthly Overage Report**
- Gửi vào cuối tháng (ngày 28-31, 11 PM)
- Đến: victory1080@gmail.com
- Nội dung:
  - Tổng doanh thu overage
  - Chi tiết từng club có overage
  - Bảng đầy đủ thông tin

**2. Subscription Expiry Warnings**
- Gửi 7 ngày trước khi hết hạn
- Đến: Email chủ club
- Nhắc nhở gia hạn

**3. Subscription Expired Notifications**
- Gửi khi subscription hết hạn
- Thông báo đã downgrade về FREE
- Hướng dẫn nâng cấp lại

---

## Xử lý các tình huống thường gặp

### 1. Club phản ánh không tạo được sân

**Nguyên nhân:** Đã đạt giới hạn số sân theo gói

**Xử lý:**
1. Kiểm tra subscription hiện tại của club
2. Xem số sân hiện tại vs giới hạn
3. Tùy chọn:
   - **Option A:** Nâng cấp gói cho club
   - **Option B:** Yêu cầu club xóa sân không dùng
   - **Option C:** Tăng giới hạn gói (edit plan)

**Ví dụ:**
```
Club ABC - Gói BASIC (max 10 sân)
Hiện có: 10 sân
→ Không tạo thêm được
→ Nâng lên PRO (max 30 sân)
```

### 2. Club vượt quota booking

**Tình huống:** Club có 1200 bookings với gói BASIC (max 1000)

**Xử lý:**
1. Hệ thống tự động tính overage: 200 bookings
2. Overage fee: 200 × 2000đ = 400,000đ
3. Hiển thị trong Overage Report
4. Gửi invoice cho club (thủ công hoặc tự động)

**Khuyến nghị:**
- Liên hệ club để nâng cấp gói PRO
- PRO có quota cao hơn và phí overage thấp hơn
- Tiết kiệm chi phí cho club

### 3. Club yêu cầu gia hạn

**Xử lý:**
1. Vào **Quản lý câu lạc bộ**
2. Click **Assign Subscription** cho club đó
3. Chọn cùng gói hiện tại
4. Đặt start_date = end_date của subscription cũ
5. Chọn billing cycle (monthly/yearly)
6. Gán gói

**Lưu ý:**
- Nếu club muốn đổi gói, chọn gói mới
- Nếu muốn đổi chu kỳ (monthly → yearly), chọn yearly

### 4. Subscription hết hạn

**Tự động xử lý:**
- Cron job chạy hàng ngày (2 AM)
- Tự động downgrade về FREE (3 tháng)
- Gửi email thông báo cho club

**Thủ công:**
1. Vào **Quản lý câu lạc bộ**
2. Tìm club có badge 🔴 Expired
3. Gán gói FREE hoặc gói mới

### 5. Club muốn hủy subscription

**Xử lý:**
1. Gán gói FREE cho club
2. Hoặc để subscription hết hạn tự nhiên
3. Club vẫn sử dụng được với giới hạn FREE

**Không thể:**
- Xóa hoàn toàn subscription
- Mọi club phải có ít nhất gói FREE

### 6. Thay đổi giá gói

**Tình huống:** Muốn tăng giá gói BASIC từ 200k → 250k

**Xử lý:**
1. Edit gói BASIC
2. Cập nhật monthly_price = 250000
3. Lưu

**Kết quả:**
- Subscription mới: Tính theo giá 250k
- Subscription cũ: Vẫn giữ giá 200k
- Đảm bảo công bằng cho khách hàng hiện tại

### 7. Tạo gói khuyến mãi

**Ví dụ:** Gói PROMO - 20 sân, 2000 bookings, 300k/tháng

**Xử lý:**
1. Tạo gói mới tên "PROMO"
2. Cấu hình giới hạn và giá
3. Gán cho các club được chọn
4. Sau khi hết khuyến mãi:
   - Deactivate gói PROMO
   - Gán lại gói thường cho các club

### 8. Xem lịch sử subscription của club

**Hiện tại:** Chưa có UI xem lịch sử

**Workaround:**
1. Vào Supabase Dashboard
2. Table Editor → `club_subscriptions`
3. Filter theo `club_id`
4. Xem tất cả subscription (active và inactive)

**Thông tin:**
- Gói đã dùng
- Thời gian sử dụng
- Billing cycle
- Ngày tạo/hết hạn

### 9. Kiểm tra tính toán overage

**Nếu nghi ngờ overage không chính xác:**

1. Vào Supabase Dashboard
2. SQL Editor, chạy:

```sql
SELECT * FROM booking_usage_tracking
WHERE club_id = 'club-id-here'
AND month = '2025-01-01';
```

3. Kiểm tra:
   - `booking_count` - Số booking thực tế
   - `overage_count` - Số booking vượt
   - `overage_fee` - Phí tính được

4. So sánh với số booking thực tế:

```sql
SELECT COUNT(*) FROM bookings
WHERE club_id = 'club-id-here'
AND created_at >= '2025-01-01'
AND created_at < '2025-02-01'
AND status != 'cancelled';
```

5. Nếu không khớp:
   - Chạy lại `increment_booking_count()`
   - Hoặc update thủ công

### 10. Reset counter đầu tháng

**Tự động:**
- Database tự động reset counter ngày 1 hàng tháng
- Không cần thao tác thủ công

**Kiểm tra:**
```sql
SELECT * FROM booking_usage_tracking
WHERE month = DATE_TRUNC('month', CURRENT_DATE);
```

Nếu không có record → Counter đã reset

---

## Best Practices

### 1. Pricing Strategy

**Khuyến nghị:**
- FREE: Đủ dùng cho club nhỏ, khuyến khích đăng ký
- BASIC: Phù hợp club trung bình, giá hợp lý
- PRO: Cho club lớn, nhiều tính năng

**Overage Fee:**
- Nên thấp hơn chi phí trung bình/booking
- Khuyến khích nâng cấp thay vì trả overage
- PRO có overage thấp hơn BASIC

### 2. Customer Communication

**Khi gán gói:**
- Giải thích rõ giới hạn
- Hướng dẫn cách theo dõi usage
- Thông báo về overage fee

**Khi gần hết quota:**
- Liên hệ trước khi đạt 100%
- Đề xuất nâng cấp
- Giải thích lợi ích

**Khi hết hạn:**
- Nhắc nhở trước 7 ngày
- Gửi email tự động
- Hỗ trợ gia hạn nhanh

### 3. Monitoring

**Hàng ngày:**
- Kiểm tra email notifications
- Xem clubs sắp hết hạn
- Theo dõi overage

**Hàng tuần:**
- Review usage statistics
- Phân tích xu hướng
- Điều chỉnh pricing nếu cần

**Hàng tháng:**
- Xem overage report
- Tính toán revenue
- Lập kế hoạch upsell

### 4. Data Integrity

**Định kỳ kiểm tra:**
- Mọi club có subscription
- Không có subscription trùng active
- Counter khớp với booking thực tế
- Email notifications hoạt động

**Backup:**
- Backup database thường xuyên
- Lưu trữ overage reports
- Archive email logs

---

## Troubleshooting

### Dashboard không hiển thị đúng

**Kiểm tra:**
1. Refresh trang
2. Clear cache trình duyệt
3. Kiểm tra console log (F12)
4. Verify database connection

### Email không gửi

**Kiểm tra:**
1. `RESEND_API_KEY` trong environment variables
2. Resend dashboard - API key status
3. Vercel function logs
4. Email address của club owner

### Cron job không chạy

**Kiểm tra:**
1. `vercel.json` có cấu hình đúng
2. Vercel dashboard → Cron Jobs
3. Project trên paid plan (Hobby/Pro)
4. Function logs trong Vercel

### Counter không chính xác

**Xử lý:**
1. Chạy verification script
2. So sánh với booking thực tế
3. Reset counter thủ công nếu cần
4. Kiểm tra database functions

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề không giải quyết được:

1. Kiểm tra logs trong Vercel Dashboard
2. Xem database logs trong Supabase
3. Tham khảo tài liệu kỹ thuật:
   - [Setup Guide](subscription-management-setup.md)
   - [Cron Jobs Setup](cron-jobs-setup.md)
4. Liên hệ developer team

---

**Cập nhật lần cuối:** 2025-01-31
