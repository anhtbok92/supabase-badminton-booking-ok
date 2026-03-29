# Test Multi-Domain trên Localhost

## Cách hoạt động

Vì localhost không hỗ trợ subdomain như production, tôi sử dụng query parameter `?app=true` để phân biệt giữa landing page và app.

## Các URL để test

### 1. Landing Page (giống sportbooking.online)
```
http://localhost:9002
```
- Hiển thị landing page
- Button "Bắt đầu đặt lịch ngay" sẽ dẫn đến `/?app=true`

### 2. App Mode (giống app.sportbooking.online)
```
http://localhost:9002?app=true
```
- Tự động redirect về `/admin?app=true`
- Truy cập full app

### 3. Truy cập trực tiếp các route trong app mode
```
http://localhost:9002/admin?app=true
http://localhost:9002/register-club?app=true
```
- Truy cập được các route của app

### 4. Thử truy cập route app không có ?app=true
```
http://localhost:9002/admin
```
- Sẽ redirect về landing page `/`
- Giống như khi user truy cập `sportbooking.online/admin` trên production

## Kịch bản test

### Test 1: Landing Page
1. Mở `http://localhost:9002`
2. Thấy landing page với button
3. Click button
4. Chuyển đến app (redirect về `/admin?app=true`)

### Test 2: Direct App Access
1. Mở `http://localhost:9002?app=true`
2. Tự động redirect về `/admin?app=true`
3. Thấy trang admin

### Test 3: Protection
1. Mở `http://localhost:9002/admin` (không có ?app=true)
2. Redirect về landing page `/`
3. Giống như production khi truy cập `sportbooking.online/admin`

## Chạy dev server

```bash
npm run dev -- -p 9002
```

Hoặc nếu port mặc định:
```bash
npm run dev
```

## So sánh Localhost vs Production

| Scenario | Localhost | Production |
|----------|-----------|------------|
| Landing page | `localhost:9002` | `sportbooking.online` |
| App access | `localhost:9002?app=true` | `app.sportbooking.online` |
| Admin page | `localhost:9002/admin?app=true` | `app.sportbooking.online/admin` |
| Protection | Redirect nếu không có `?app=true` | Redirect nếu không phải subdomain `app` |

## Lưu ý

- Query param `?app=true` chỉ dùng cho localhost testing
- Production sẽ dùng subdomain để phân biệt
- Middleware tự động detect localhost và xử lý khác biệt
