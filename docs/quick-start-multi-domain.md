# Quick Start - Cấu hình Multi-Domain

## Bước 1: Cấu hình DNS (tại nhà cung cấp domain)

### Thêm 2 records sau:

1. **A Record cho domain chính**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

2. **CNAME cho subdomain app**
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

## Bước 2: Thêm domains vào Vercel

1. Vào project → Settings → Domains
2. Add domain: `sportbooking.online`
3. Add domain: `app.sportbooking.online`
4. Đợi verify (5-30 phút)

## Bước 3: Deploy

```bash
git add .
git commit -m "Add multi-domain support"
git push
```

## Kết quả

- ✅ `sportbooking.online` → Landing page
- ✅ `app.sportbooking.online` → App đặt lịch
- ✅ Button trên landing page dẫn đến app

## Test

1. Mở https://sportbooking.online → Thấy landing page
2. Click button → Chuyển đến https://app.sportbooking.online
3. Mở https://app.sportbooking.online → Vào app luôn

Xong! 🎉
