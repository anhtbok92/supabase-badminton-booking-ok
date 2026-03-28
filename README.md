# Badminton Court Booking System

Hệ thống đặt sân cầu lông online, xây dựng bằng Next.js 15 + Supabase.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **AI**: Google Genkit
- **Image Upload**: Cloudinary
- **Email**: Resend API
- **Cron Jobs**: Vercel Cron

## Yêu cầu

- Node.js >= 18
- npm
- Tài khoản [Supabase](https://supabase.com) (đã tạo project)

## Cài đặt

### 1. Clone và install dependencies

```bash
git clone <repo-url>
cd <project-folder>
npm install
```

### 2. Cấu hình environment variables

Copy file `.env.example` thành `.env` và điền thông tin:

```bash
cp .env.example .env
```

```env
# Google Genkit AI
GOOGLE_GENAI_API_KEY=your-google-genai-api-key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Lấy các giá trị từ Supabase Dashboard:
- **Project Settings > API** → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 3. Chạy SQL migrations trên Supabase

Vào **Supabase Dashboard > SQL Editor**, chạy lần lượt các file migration:

1. `supabase/migrations/001_initial_schema.sql` — Tạo 7 bảng: `users`, `clubs`, `courts`, `bookings`, `news`, `news_tags`, `club_types`
2. `supabase/migrations/002_rls_policies.sql` — Tạo RLS policies và helper functions
3. `supabase/migrations/003_subscription_management.sql` — Tạo hệ thống quản lý gói đăng ký
4. `supabase/migrations/004_subscription_expiry_handling.sql` — Tạo functions xử lý hết hạn gói đăng ký

Hoặc nếu dùng Supabase CLI:

```bash
supabase db push
```

### 4. Tạo tài khoản admin đầu tiên

Sau khi chạy migrations, tạo user admin bằng cách:

1. Vào **Supabase Dashboard > Authentication > Users** → tạo user mới với email `0123456789@badminton.vn` và password
2. Vào **SQL Editor**, chạy:

```sql
INSERT INTO public.users (id, email, phone, role)
VALUES (
  '<user-id-từ-auth>',
  '0123456789@badminton.vn',
  '0123456789',
  'admin'
);
```

### 5. Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:9002](http://localhost:9002)

## Cấu trúc thư mục chính

```
src/
├── app/                    # Next.js App Router pages
│   ├── (tabs)/             # Các trang chính (booking, news, account, my-bookings)
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes (admin create-user, crawl)
│   ├── booking/[clubId]/   # Chi tiết đặt sân
│   ├── login/              # Đăng nhập / Đăng ký
│   ├── news/[id]/          # Chi tiết tin tức
│   ├── payment/            # Thanh toán
│   └── register-club/      # Đăng ký câu lạc bộ
├── components/             # Shared UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Types, utilities, data helpers
└── supabase/               # Supabase client, hooks, provider
    ├── auth/               # useUser() hook
    ├── hooks/              # useSupabaseQuery(), useSupabaseRow()
    ├── admin.ts            # Admin client (service role)
    ├── client.ts           # Browser client
    ├── provider.tsx        # SupabaseProvider context
    └── server.ts           # Server client
```

## Authentication

Hệ thống sử dụng số điện thoại làm tài khoản, được chuyển đổi sang email format `{phone}@badminton.vn` để tương thích với Supabase Auth (email/password).

- Đăng nhập: nhập SĐT + mật khẩu
- Đăng ký: nhập SĐT + mật khẩu + tên → tự tạo user profile trong bảng `users`

## Roles

| Role | Quyền |
|------|-------|
| `admin` | Toàn quyền quản trị |
| `club_owner` | Quản lý club được gán (`managed_club_ids`) |
| `staff` | Nhân viên |
| `customer` | Người dùng thông thường |

## Scripts

| Lệnh | Mô tả |
|-------|-------|
| `npm run dev` | Chạy dev server (port 9002) |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra linting |
| `npm run typecheck` | Kiểm tra TypeScript types |
| `npm run verify-subscription-schema` | Kiểm tra schema subscription management |
| `npm run test-subscription-lifecycle` | Test toàn bộ lifecycle subscription |

### Testing Scripts

Hệ thống bao gồm các script testing tự động:

**Verify Subscription Schema:**
```bash
npm run verify-subscription-schema
```
Kiểm tra:
- Tables đã được tạo đúng
- Database functions hoạt động
- Default plans tồn tại
- Columns được thêm vào clubs table

**Test Subscription Lifecycle:**
```bash
npm run test-subscription-lifecycle
```
Test toàn bộ flow:
- Tạo club → Auto-assign FREE plan
- Upgrade to BASIC → Tạo courts
- Tạo bookings → Kiểm tra quota
- Test overage calculation
- Test expiry handling

Chi tiết xem: [scripts/README-TESTING.md](scripts/README-TESTING.md)

## Tính năng chính

### 1. Đặt sân cầu lông
- Xem danh sách câu lạc bộ và sân
- Đặt sân theo giờ
- Quản lý lịch đặt sân của bản thân
- Thanh toán online

### 2. Quản lý câu lạc bộ
- Đăng ký câu lạc bộ mới (partnership)
- Quản lý thông tin câu lạc bộ
- Quản lý sân và lịch hoạt động
- Xem thống kê booking

### 3. Hệ thống gói đăng ký (Subscription Management)

Hệ thống quản lý gói đăng ký cho phép admin kiểm soát tài nguyên và doanh thu từ các câu lạc bộ.

#### Các gói đăng ký mặc định:

| Gói | Số sân | Booking/tháng | Giá tháng | Giá năm | Phí vượt mức |
|-----|--------|---------------|-----------|---------|--------------|
| **FREE** | 3 | 100 | 0đ | 0đ | 0đ |
| **BASIC** | 10 | 1,000 | 200,000đ | 2,000,000đ | 2,000đ/booking |
| **PRO** | 30 | 3,000 | 500,000đ | 5,000,000đ | 1,500đ/booking |

#### Tính năng:

**Quản lý gói đăng ký (Admin):**
- Tạo, chỉnh sửa, xóa gói đăng ký
- Cấu hình giới hạn tài nguyên (số sân, số booking)
- Thiết lập giá và phí vượt mức
- Gán gói cho câu lạc bộ

**Giới hạn tài nguyên:**
- Giới hạn số sân theo gói đăng ký
- Theo dõi số booking theo tháng
- Tự động tính phí vượt mức khi vượt quota
- Hiển thị usage realtime (ví dụ: "450/1000 bookings")

**Thông báo tự động:**
- Cảnh báo khi sử dụng 80%, 90%, 100% quota
- Thông báo 7 ngày trước khi hết hạn
- Thông báo khi gói đăng ký hết hạn
- Email báo cáo overage hàng tháng

**Báo cáo và thống kê:**
- Dashboard doanh thu (MRR, ARR)
- Phân bố câu lạc bộ theo gói
- Báo cáo overage chi tiết
- Thống kê sử dụng tài nguyên

**Tự động hóa:**
- Auto-assign gói FREE khi đăng ký mới (3 tháng trial)
- Auto-downgrade về FREE khi hết hạn
- Cron job kiểm tra hết hạn hàng ngày (2 AM)
- Cron job báo cáo overage cuối tháng (11 PM)

#### Tài liệu chi tiết:
- [Setup Guide](docs/subscription-management-setup.md) - Hướng dẫn cài đặt và deployment
- [Cron Jobs Setup](docs/cron-jobs-setup.md) - Cấu hình cron jobs
- [Admin User Guide](docs/admin-subscription-guide.md) - Hướng dẫn sử dụng cho admin
- [Deployment Checklist](docs/deployment-checklist.md) - Checklist triển khai production

### 4. Tin tức
- Đăng và quản lý tin tức
- Phân loại theo tags
- Rich text editor

### 5. Admin Dashboard
- Quản lý users, clubs, courts, bookings
- Quản lý gói đăng ký và doanh thu
- Thống kê và báo cáo
- Notification center

---

## Tài liệu

### Hướng dẫn cài đặt và triển khai
- [README](README.md) - Tổng quan dự án và cài đặt cơ bản
- [Subscription Management Setup](docs/subscription-management-setup.md) - Hướng dẫn cài đặt hệ thống subscription
- [Cron Jobs Setup](docs/cron-jobs-setup.md) - Cấu hình và quản lý cron jobs
- [Deployment Checklist](docs/deployment-checklist.md) - Checklist triển khai production

### Hướng dẫn sử dụng
- [Admin User Guide](docs/admin-subscription-guide.md) - Hướng dẫn chi tiết cho admin
- [API Reference](docs/api-reference.md) - Tài liệu API endpoints

### Tài liệu kỹ thuật
- [Requirements](/.kiro/specs/subscription-management/requirements.md) - Yêu cầu hệ thống
- [Design](/.kiro/specs/subscription-management/design.md) - Thiết kế kỹ thuật
- [Tasks](/.kiro/specs/subscription-management/tasks.md) - Kế hoạch triển khai
- [Testing Guide](scripts/README-TESTING.md) - Hướng dẫn testing

### Tài liệu khác
- [Blueprint](docs/blueprint.md) - Kiến trúc tổng thể
- [Backend API](docs/backend.json) - API specification
