# Badminton Court Booking System

Hệ thống đặt sân cầu lông online, xây dựng bằng Next.js 15 + Supabase.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **AI**: Google Genkit
- **Image Upload**: Cloudinary

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

Vào **Supabase Dashboard > SQL Editor**, chạy lần lượt 2 file migration:

1. `supabase/migrations/001_initial_schema.sql` — Tạo 7 bảng: `users`, `clubs`, `courts`, `bookings`, `news`, `news_tags`, `club_types`
2. `supabase/migrations/002_rls_policies.sql` — Tạo RLS policies và helper functions

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
