# Hướng dẫn cấu hình Multi-Domain cho Sport Booking

## Tổng quan
Hệ thống sử dụng 2 domains:
- `sportbooking.online` - Landing page
- `app.sportbooking.online` - Ứng dụng đặt lịch chính

## Bước 1: Cấu hình DNS

### Tại nhà cung cấp domain (nơi bạn mua domain)

1. **Cấu hình cho domain chính (sportbooking.online)**
   ```
   Type: A Record
   Name: @ (hoặc để trống)
   Value: 76.76.21.21
   TTL: Auto hoặc 3600
   ```

2. **Cấu hình cho subdomain (app.sportbooking.online)**
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   TTL: Auto hoặc 3600
   ```

3. **Cấu hình cho www (optional)**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: Auto hoặc 3600
   ```

### Lưu ý về DNS
- Thời gian propagation: 5 phút - 48 giờ (thường là 15-30 phút)
- Có thể kiểm tra bằng lệnh: `nslookup sportbooking.online`

## Bước 2: Cấu hình Vercel

### 2.1. Thêm domains vào Vercel Project

1. Truy cập: https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào tab **Settings** → **Domains**
4. Thêm các domains sau:

   **Domain 1: sportbooking.online**
   - Click "Add"
   - Nhập: `sportbooking.online`
   - Click "Add"
   - Vercel sẽ tự động verify

   **Domain 2: app.sportbooking.online**
   - Click "Add"
   - Nhập: `app.sportbooking.online`
   - Click "Add"
   - Vercel sẽ tự động verify

   **Domain 3 (Optional): www.sportbooking.online**
   - Click "Add"
   - Nhập: `www.sportbooking.online`
   - Chọn redirect to `sportbooking.online`

### 2.2. Verify Domains

Vercel sẽ hiển thị trạng thái của từng domain:
- ✅ Valid Configuration - Domain đã sẵn sàng
- ⏳ Pending - Đang chờ DNS propagate
- ❌ Invalid Configuration - Cần kiểm tra lại DNS

## Bước 3: Deploy và Test

### 3.1. Deploy code
```bash
git add .
git commit -m "Add multi-domain support with landing page"
git push
```

Vercel sẽ tự động deploy.

### 3.2. Test các scenarios

1. **Test Landing Page**
   - Truy cập: https://sportbooking.online
   - Kết quả: Hiển thị landing page
   - Click button "Bắt đầu đặt lịch ngay"
   - Kết quả: Chuyển đến https://app.sportbooking.online

2. **Test App Domain**
   - Truy cập: https://app.sportbooking.online
   - Kết quả: Redirect về /admin (hoặc trang app chính)

3. **Test Redirect**
   - Truy cập: https://sportbooking.online/admin
   - Kết quả: Redirect về https://sportbooking.online (landing page)

## Cấu trúc Code

### Middleware (src/middleware.ts)
- Phân biệt domain và xử lý routing
- `sportbooking.online` → Landing page only
- `app.sportbooking.online` → Full app access

### Landing Page (src/app/(landing)/page.tsx)
- Route group `(landing)` không ảnh hưởng URL
- Hiển thị khi truy cập domain chính

### App Routes
- Tất cả routes hiện tại (/admin, /register-club, etc.)
- Chỉ accessible qua app.sportbooking.online

## Troubleshooting

### Domain không hoạt động
1. Kiểm tra DNS đã propagate chưa: https://dnschecker.org
2. Kiểm tra Vercel domain status
3. Clear browser cache và thử incognito mode

### Redirect loop
1. Kiểm tra middleware logic
2. Xem Vercel deployment logs
3. Kiểm tra browser console

### SSL Certificate
- Vercel tự động cấp SSL certificate
- Có thể mất 5-10 phút sau khi add domain
- Nếu lỗi, thử remove và add lại domain

## Bước 4: Cấu hình Wildcard Domain cho Multi-Tenant Subdomain

Hệ thống hỗ trợ subdomain riêng cho từng câu lạc bộ, ví dụ: `caulonglinhdam.sportbooking.online`. Mỗi club có thể được admin gán một `custom_subdomain` trong trang quản trị, và subdomain đó sẽ tự động hoạt động nhờ wildcard domain.

### 4.1. Cấu hình DNS Wildcard

Tại nhà cung cấp domain, thêm record sau:

```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: Auto hoặc 3600
```

Record này cho phép **mọi** subdomain (ví dụ `caulonglinhdam.sportbooking.online`, `sanbonghanoi.sportbooking.online`) trỏ về Vercel.

**Lưu ý quan trọng:**
- Wildcard CNAME (`*`) **không** ghi đè các record cụ thể đã có (`app`, `www`). Các record cụ thể luôn được ưu tiên hơn wildcard.
- Các domain hiện tại (`sportbooking.online`, `app.sportbooking.online`, `www.sportbooking.online`) vẫn hoạt động bình thường.
- Kiểm tra propagation: `nslookup test123.sportbooking.online` — nếu trả về IP của Vercel là thành công.

### 4.2. Thêm Wildcard Domain vào Vercel

1. Truy cập: https://vercel.com/dashboard
2. Chọn project Sport Booking
3. Vào tab **Settings** → **Domains**
4. Click **Add** và nhập: `*.sportbooking.online`
5. Click **Add** để xác nhận

Vercel sẽ tự động cấp SSL certificate cho wildcard domain. Quá trình này có thể mất 5-10 phút.

**Danh sách domains sau khi cấu hình xong:**

| Domain | Mục đích |
|---|---|
| `sportbooking.online` | Landing page |
| `app.sportbooking.online` | App đặt lịch (multi-club) |
| `www.sportbooking.online` | Redirect về landing page |
| `*.sportbooking.online` | Wildcard — subdomain riêng cho từng club |

### 4.3. Cách hoạt động

Khi một request đến `{subdomain}.sportbooking.online`:

1. DNS wildcard trỏ request về Vercel
2. Next.js middleware extract subdomain từ `Host` header
3. Middleware query database tìm club có `custom_subdomain` khớp
4. Nếu tìm thấy → set tenant context, render app với branding của club đó
5. Nếu không tìm thấy → redirect về `app.sportbooking.online`

Các subdomain hệ thống (app, www, api, admin, staging, dev, test, beta, demo, static, cdn, assets, img, images, ns1, ns2, dns, mx) được bảo vệ và không thể gán cho club.

### 4.4. Test Wildcard Domain

1. **Gán subdomain cho club trong admin:**
   - Vào trang admin → Quản lý câu lạc bộ → Chỉnh sửa club
   - Nhập subdomain (ví dụ: `caulonglinhdam`)
   - Lưu lại

2. **Test truy cập:**
   - Truy cập: `https://caulonglinhdam.sportbooking.online`
   - Kết quả: Hiển thị app với branding của club đó, bỏ qua bước chọn club

3. **Test subdomain không tồn tại:**
   - Truy cập: `https://khongtontai.sportbooking.online`
   - Kết quả: Redirect về `https://app.sportbooking.online`

4. **Test domain hiện tại vẫn hoạt động:**
   - `https://sportbooking.online` → Landing page (không thay đổi)
   - `https://app.sportbooking.online` → App multi-club (không thay đổi)

### 4.5. Phát triển local (localhost)

Khi phát triển trên máy local, middleware hỗ trợ subdomain qua localhost:

```
http://caulonglinhdam.localhost:3000
```

Không cần cấu hình DNS cho localhost — trình duyệt tự resolve `*.localhost` về `127.0.0.1`.

## Các bước tiếp theo

1. ✅ Cấu hình DNS (A record + CNAME app)
2. ✅ Add domains vào Vercel
3. ✅ Deploy code
4. ✅ Test các scenarios
5. ✅ Cấu hình wildcard DNS (`*.sportbooking.online`)
6. ✅ Add wildcard domain vào Vercel
7. ✅ Gán subdomain cho club trong admin
8. 🎨 Tùy chỉnh landing page đẹp hơn

## Liên hệ hỗ trợ

Nếu gặp vấn đề:
- Vercel Support: https://vercel.com/support
- DNS Provider Support: Liên hệ nhà cung cấp domain của bạn
