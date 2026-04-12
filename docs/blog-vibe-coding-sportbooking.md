# Vibe Coding: Hành trình xây dựng sportbooking.online từ ý tưởng đến sản phẩm thực tế

> Chia sẻ kinh nghiệm dùng AI-assisted development (vibe coding) để xây dựng một hệ thống đặt sân thể thao hoàn chỉnh — từ một developer solo đến một platform multi-tenant phục vụ nhiều câu lạc bộ.

---

## Bối cảnh: Tại sao lại là "Vibe Coding"?

Cuối năm 2024, khái niệm "vibe coding" bắt đầu nổi lên — thay vì ngồi gõ từng dòng code, bạn mô tả ý tưởng cho AI và cùng nó xây dựng sản phẩm. Nghe có vẻ viễn tưởng, nhưng tôi đã thử và kết quả là **sportbooking.online** — một hệ thống đặt sân cầu lông online đang chạy production, phục vụ nhiều câu lạc bộ thực tế.

Bài viết này không phải để quảng cáo tool nào. Đây là câu chuyện thật, với những bài học thật, dành cho các bạn dev đang tò mò về cách AI thay đổi workflow lập trình.

---

## Tech Stack: Chọn đúng công nghệ từ đầu

Một trong những quyết định quan trọng nhất khi vibe coding là chọn tech stack mà AI hiểu tốt và có ecosystem mạnh:

- **Next.js 15** (App Router) + **React 19** — Server Components, SSG/ISR cho SEO, API Routes cho backend
- **Supabase** — PostgreSQL, Auth, Realtime, Row Level Security. Thay thế hoàn toàn một backend riêng
- **TailwindCSS** + **shadcn/ui** — UI nhanh, consistent, AI generate code chuẩn
- **Google Genkit** — AI content generation (blog, SEO content, user guide)
- **Vercel** — Deploy, Cron Jobs, Edge Functions, multi-domain
- **Resend** — Email notifications
- **Cloudinary** — Image upload và CDN

Tại sao lại chọn stack này? Vì khi vibe coding, bạn cần AI hiểu rõ framework bạn dùng. Next.js + Supabase + TailwindCSS là combo mà hầu hết AI model đều nắm rất vững. Điều này giúp code generate ra ít lỗi hơn, và bạn tốn ít thời gian sửa hơn.

---

## Quá trình xây dựng: Từ MVP đến Production

### Giai đoạn 1: MVP — Đặt sân cơ bản

Bắt đầu với blueprint đơn giản: hiển thị danh sách câu lạc bộ, chọn sân, chọn giờ, đặt lịch. Tôi mô tả từng feature cho AI và cùng nó build:

- Trang listing câu lạc bộ với filter theo loại sân
- Calendar chọn ngày, bảng slot 30 phút với color-coded status (Available, Booked, Blocked)
- Hệ thống pricing theo khung giờ (giờ vàng, giờ thường) và ngày (weekday/weekend)
- QR code thanh toán + upload proof of payment
- Auth bằng số điện thoại (convert sang email format `{phone}@badminton.vn` để dùng Supabase Auth)

Giai đoạn này mất khoảng 2-3 tuần. Phần lớn thời gian là iterate với AI để tinh chỉnh UX, không phải viết logic từ đầu.

### Giai đoạn 2: Admin Dashboard — Quản lý mọi thứ

Đây là phần phức tạp nhất. Admin dashboard có hơn **39 component files** trong `src/app/admin/_components/`, mỗi file đảm nhiệm một chức năng riêng:

- **Quản lý câu lạc bộ** — CRUD clubs, courts, pricing, amenities
- **Quản lý lịch đặt** — Booking management, schedule calendar, fixed monthly bookings
- **Quản lý nhân viên** — Staff accounts, role-based access
- **Quản lý khách hàng** — Customer profiles, guest tracking
- **Thống kê** — Revenue charts (Recharts), booking trends, usage analytics
- **Tin tức & Blog** — Rich text editor (Tiptap), AI-powered blog writing
- **SEO Management** — Auto-generate landing pages, metadata management
- **Subscription Plans** — Tiered pricing (FREE/BASIC/PRO), quota enforcement
- **Event Management** — Sự kiện, time slots, participant tracking
- **Club Crawler** — Import data câu lạc bộ từ bên ngoài (Cheerio + Axios)

Mỗi feature tôi dùng Kiro Specs để plan trước khi code. Ví dụ, hệ thống Subscription Management có đầy đủ:
- `requirements.md` — Yêu cầu chi tiết
- `design.md` — Thiết kế kỹ thuật (database schema, API design)
- `tasks.md` — Breakdown thành từng task nhỏ

AI đọc spec rồi implement từng task. Tôi review, adjust, rồi move on. Flow này cực kỳ hiệu quả.

### Giai đoạn 3: Multi-Tenant & SEO

Đây là lúc hệ thống thực sự "lên level":

**Multi-tenant subdomain:** Mỗi câu lạc bộ có subdomain riêng (ví dụ: `caulonglinhdam.sportbooking.online`). Middleware detect subdomain từ Host header, query database tìm club, set tenant context. Club owner đăng nhập vào admin chỉ thấy data của club mình.

**SEO Pages tự động:** Hệ thống generate 6 loại trang SEO từ data thực trong database:
- Theo thành phố: `san-cau-long-ha-noi`
- Theo quận: `san-cau-long-hoang-mai`
- Theo vị trí: `san-cau-long-gan-my-dinh` (Haversine formula)
- Theo giá: `san-cau-long-gia-re-ha-noi`
- Theo tiện ích: `san-cau-long-co-mai-che-ha-noi`
- Theo giờ: `san-cau-long-mo-dem-ha-noi`

Mỗi khi admin save thông tin club → auto trigger API generate SEO pages → upsert vào database → ISR revalidate mỗi giờ. Không seed cứng, không hardcode — tất cả từ data thực.

### Giai đoạn 4: Automation & Polish

- **Cron Jobs** — Vercel Cron chạy daily (check subscription expiry, auto-downgrade) và monthly (overage report, email notification)
- **Email tự động** — Cảnh báo quota 80%/90%/100%, thông báo 7 ngày trước hết hạn, báo cáo overage
- **PDF Generation** — Export user guide, owner guide (jsPDF + jspdf-autotable)
- **QR Code** — Generate QR thanh toán cho từng club

---

## Database: 21 Migrations kể chuyện gì?

Nhìn vào folder `supabase/migrations/` với 21 file migration, bạn sẽ thấy câu chuyện evolution của sản phẩm:

```
001_initial_schema.sql          → 7 bảng core ban đầu
002_rls_policies.sql            → Security (Row Level Security)
003_subscription_management.sql → Hệ thống gói đăng ký
004_subscription_expiry.sql     → Xử lý hết hạn tự động
005_fix_rls_vulnerabilities.sql → Fix security issues
006_fixed_monthly_bookings.sql  → Lịch cố định hàng tháng
007-008: SEO metadata, club slugs
009: Blog posts
010: Fix booking quota counting
011-013: UI improvements (colors, settings)
014: Custom subdomain (multi-tenant)
015-017: Icons, events, event time slots
018-019: SEO pages system, dynamic amenities
020-021: Backfill data, SEO prefixes
```

Mỗi migration là một iteration. Không có "thiết kế hoàn hảo từ đầu" — chỉ có ship nhanh, nhận feedback, và improve. Đây chính là tinh thần của vibe coding.

---

## Tư duy tổ chức code: Steering Rules

Một bài học lớn: khi vibe coding, AI có xu hướng dump tất cả code vào một file. Nếu không có rules rõ ràng, bạn sẽ có những file 1000+ dòng không thể maintain.

Tôi tạo **Steering Rules** trong `.kiro/steering/clean-code.md` để AI tuân theo:

```
- Mỗi file tối đa ~300 dòng
- Mỗi feature tách thành file riêng trong _components/
- File đặt tên kebab-case, export PascalCase
- page.tsx chỉ chứa auth check + render component chính
- Schemas và types dùng chung đặt trong schemas.ts
- Không duplicate code — extract ra utility/hook
```

Kết quả? Admin dashboard có 39 files gọn gàng thay vì 1 file khổng lồ. Mỗi file có trách nhiệm rõ ràng. Khi cần sửa booking logic, tôi mở `booking-manager.tsx`. Khi cần sửa SEO, tôi mở `seo-manager.tsx`. Không bao giờ phải scroll qua hàng nghìn dòng code không liên quan.

Cấu trúc chuẩn cho mỗi route:

```
src/app/[route]/
├── page.tsx                    # Entry point — auth + loading + render
├── _components/
│   ├── schemas.ts              # Zod schemas & types
│   ├── [feature]-manager.tsx   # Component chính (~300 dòng)
│   └── [shared-component].tsx  # Component dùng chung
```

---

## Business Logic: Những bài toán thực tế

### Hệ thống Pricing phức tạp

Mỗi club có pricing riêng, chia theo:
- Khung giờ (giờ vàng 17h-21h giá cao hơn)
- Ngày trong tuần (weekend giá khác weekday)
- Priority tiers (giờ nào ưu tiên hiển thị trước)

```typescript
type Pricing = {
  weekday: PriceTier[];  // Mỗi tier: timeRange + price + is_priority
  weekend: PriceTier[];
};
```

### Subscription & Quota Management

3 gói: FREE (3 sân, 100 booking/tháng), BASIC (10 sân, 1000 booking), PRO (30 sân, 3000 booking). Database functions xử lý real-time:

- `check_court_limit()` — Kiểm tra trước khi tạo sân mới
- `check_booking_quota()` — Tính usage percentage, overage
- `increment_booking_count()` — Tự động tính phí vượt mức
- `decrement_booking_count()` — Trừ khi hủy booking

Logic này chạy ở database level (PostgreSQL functions), không phải application level. Nhanh hơn, an toàn hơn, không bị race condition.

### Role-Based Access Control

4 roles với quyền khác nhau:
- **Admin** — Toàn quyền, thấy tất cả clubs
- **Club Owner** — Chỉ thấy clubs mình quản lý
- **Staff** — Chỉ thấy schedule và booking
- **Customer** — Đặt sân, xem lịch của mình

Supabase RLS (Row Level Security) enforce ở database level. Kể cả API bị bypass, data vẫn an toàn.

---

## Những bài học rút ra

### 1. Spec trước, code sau

Với mỗi feature lớn, tôi tạo Kiro Spec gồm 3 file: requirements → design → tasks. AI đọc spec và implement chính xác hơn nhiều so với mô tả bằng lời. Tôi có 5 specs cho 5 feature lớn nhất: subscription management, event booking, multi-tenant subdomain, recurring monthly booking, và migration từ Firebase sang Supabase.

### 2. Steering Rules là bắt buộc

Không có rules, AI sẽ viết code "chạy được" nhưng không maintainable. Steering rules giống như coding standards cho team — chỉ là "team" ở đây có một thành viên là AI.

### 3. Database-first thinking

Đẩy logic xuống database (PostgreSQL functions, RLS policies) thay vì xử lý ở application. AI generate SQL rất tốt, và logic ở database level đáng tin cậy hơn.

### 4. Iterate nhanh, đừng cầu toàn

21 migrations = 21 lần thay đổi database. Không có thiết kế hoàn hảo từ đầu. Ship MVP, nhận feedback từ chủ sân thực tế, rồi improve. Vibe coding cho phép bạn iterate cực nhanh — thay đổi một feature có thể chỉ mất vài giờ thay vì vài ngày.

### 5. AI giỏi generate, con người giỏi architect

AI viết code nhanh, nhưng quyết định kiến trúc vẫn là của bạn. Chọn multi-tenant hay single-tenant? SEO pages generate từ data hay hardcode? Pricing logic ở database hay application? Những quyết định này define sản phẩm, và AI không thể làm thay bạn.

### 6. Đừng sợ refactor

Ban đầu tôi dùng Firebase, sau đó migrate sang Supabase. Đó là một quyết định lớn, nhưng với AI hỗ trợ, quá trình migration mượt hơn nhiều so với tưởng tượng. Có cả một spec riêng cho việc này: `firebase-to-supabase-migration`.

---

## Con số thực tế

- **39 admin components** — mỗi file một chức năng
- **21 database migrations** — evolution liên tục
- **5 Kiro Specs** — plan chi tiết cho feature lớn
- **2 steering rules** — clean code + SEO guidelines
- **6 loại SEO pages** — auto-generated từ data thực
- **4 cron jobs** — automation chạy daily/monthly
- **4 user roles** — RBAC với RLS enforcement
- **3 subscription tiers** — FREE/BASIC/PRO với quota management
- **Multi-domain** — landing page + app + wildcard subdomain cho từng club

---

## Kết luận

Vibe coding không phải là "để AI viết hết code cho mình". Nó là một cách làm việc mới, nơi bạn tập trung vào architecture, business logic, và user experience — còn phần implementation được accelerate bởi AI.

sportbooking.online là bằng chứng rằng một developer solo, với tư duy đúng và công cụ phù hợp, có thể xây dựng một hệ thống production-grade phức tạp trong thời gian ngắn. Không phải vì AI thay thế developer, mà vì AI giúp developer làm được nhiều hơn.

Nếu bạn đang cân nhắc thử vibe coding, lời khuyên của tôi: hãy bắt đầu với một dự án thực tế, đặt rules rõ ràng cho AI, và luôn giữ quyền quyết định kiến trúc trong tay mình.

Happy coding. 🏸
