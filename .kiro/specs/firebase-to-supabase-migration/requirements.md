# Requirements Document

## Introduction

Migrate hệ thống đặt sân cầu lông hiện tại từ Firebase (Auth, Firestore, Storage) sang Supabase (Auth, PostgreSQL, Storage). Hệ thống hiện dùng Next.js với Firebase client SDK cho authentication, real-time database (Firestore), và file storage. Mục tiêu là thay thế toàn bộ Firebase SDK bằng Supabase client, giữ nguyên chức năng và UX hiện tại. Không cần migrate data.

## Glossary

- **Supabase_Client**: Supabase JavaScript client SDK (`@supabase/supabase-js`) dùng để tương tác với Supabase Auth, Database, và Storage
- **Supabase_Provider**: React Context Provider cung cấp Supabase client instance cho toàn bộ ứng dụng
- **RLS**: Row Level Security - cơ chế bảo mật cấp hàng của PostgreSQL, thay thế Firestore Security Rules
- **Auth_Module**: Module xử lý đăng nhập, đăng ký, đăng xuất và quản lý session người dùng
- **Database_Module**: Module xử lý đọc/ghi dữ liệu từ PostgreSQL thông qua Supabase client
- **Realtime_Module**: Module lắng nghe thay đổi dữ liệu real-time từ Supabase Realtime
- **Hook_Layer**: Tầng React hooks tùy chỉnh (`useCollection`, `useDoc`, `useUser`) cung cấp dữ liệu cho components
- **Admin_Dashboard**: Trang quản trị tổng hợp cho admin quản lý clubs, bookings, users, news
- **Club**: Câu lạc bộ/sân cầu lông
- **Court**: Sân con thuộc một Club
- **Booking**: Lượt đặt sân của người dùng
- **UserProfile**: Hồ sơ người dùng bao gồm role và thông tin cá nhân

## Requirements

### Requirement 1: Thiết lập Supabase Client và Provider

**User Story:** As a developer, I want to replace Firebase initialization with Supabase client setup, so that the entire app uses Supabase as the backend.

#### Acceptance Criteria

1. THE Supabase_Client SHALL be initialized using environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. THE Supabase_Provider SHALL replace FirebaseClientProvider trong root layout, cung cấp Supabase client instance cho toàn bộ component tree
3. WHEN any component calls `useSupabase()`, THE Supabase_Provider SHALL return a valid Supabase client instance
4. THE Supabase_Client SHALL remove all Firebase SDK dependencies (`firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`) from the project

### Requirement 2: Migrate Authentication

**User Story:** As a user, I want to log in and register using my phone number, so that I can access my account on the new backend.

#### Acceptance Criteria

1. WHEN a user registers with a phone number and password, THE Auth_Module SHALL create a new Supabase Auth user with email format `{phone}@badminton.vn` and the provided password
2. WHEN a user logs in with a phone number and password, THE Auth_Module SHALL authenticate via Supabase Auth using email format `{phone}@badminton.vn`
3. WHEN a user logs out, THE Auth_Module SHALL end the Supabase session and clear local state
4. THE Hook_Layer SHALL provide a `useUser()` hook that listens to Supabase auth state changes and returns the current user object and loading state
5. WHEN the auth state changes (login/logout), THE Hook_Layer SHALL notify all subscribed components immediately
6. WHEN an admin creates a new staff or club owner account in Admin_Dashboard, THE Auth_Module SHALL create the user via Supabase Admin API (service role key) on the server side

### Requirement 3: Thiết kế Database Schema (PostgreSQL)

**User Story:** As a developer, I want a PostgreSQL schema that mirrors the current Firestore data structure, so that all existing features work with the relational database.

#### Acceptance Criteria

1. THE Database_Module SHALL create a `users` table with columns: `id` (UUID, references auth.users), `email`, `phone`, `role` (enum: admin, club_owner, staff, customer), `managed_club_ids` (UUID array), `is_locked` (boolean), `created_at`
2. THE Database_Module SHALL create a `clubs` table with columns: `id` (UUID), `name`, `address`, `phone`, `rating`, `image_urls` (text array), `pricing` (JSONB), `operating_hours`, `services_html`, `latitude`, `longitude`, `club_type`, `is_active`, `payment_qr_url`, `price_list_html`, `price_list_image_url`, `map_video_url`, `verification_status`, `owner_name`, `owner_phone`, `number_of_courts`, `description`, `owner_id` (UUID), `created_at`
3. THE Database_Module SHALL create a `courts` table with columns: `id` (UUID), `club_id` (UUID, foreign key to clubs), `name`, `description`, `image_urls` (text array), `order` (integer), `created_at`
4. THE Database_Module SHALL create a `bookings` table with columns: `id` (UUID), `user_id` (UUID, nullable), `club_id` (UUID), `club_name`, `date` (text), `slots` (JSONB), `total_price` (numeric), `status` (text), `name`, `phone`, `payment_proof_image_urls` (text array), `created_at`, `is_deleted` (boolean), `booking_group_id` (text)
5. THE Database_Module SHALL create a `news` table with columns: `id` (UUID), `title`, `short_description`, `content_html`, `banner_image_url`, `tags` (text array), `created_at`
6. THE Database_Module SHALL create a `news_tags` table with columns: `id` (UUID), `name`
7. THE Database_Module SHALL create a `club_types` table with columns: `id` (UUID), `name`, `order` (integer)

### Requirement 4: Thiết lập Row Level Security (RLS)

**User Story:** As a developer, I want RLS policies that replicate the current Firestore security rules, so that data access is properly controlled.

#### Acceptance Criteria

1. THE RLS policies SHALL allow public read access to `clubs`, `news`, `news_tags`, `club_types` tables
2. THE RLS policies SHALL allow public read (list) access to `bookings` table for checking availability
3. THE RLS policies SHALL allow only the user themselves or an admin to read/write their own `users` row
4. THE RLS policies SHALL allow only admins to list all users
5. THE RLS policies SHALL allow anyone to create a booking
6. THE RLS policies SHALL allow only admins or the managing club owner to update/delete bookings
7. THE RLS policies SHALL allow only admins to create/update/delete news, news_tags, and club_types
8. THE RLS policies SHALL allow admins or managing club owners to manage courts belonging to their clubs
9. WHEN a club owner manages a club, THE RLS policies SHALL verify that the club ID exists in the user's `managed_club_ids` array

### Requirement 5: Migrate React Hooks (useCollection, useDoc, useUser)

**User Story:** As a developer, I want replacement hooks that use Supabase instead of Firestore, so that all components receive data from the new backend.

#### Acceptance Criteria

1. THE Hook_Layer SHALL provide a `useSupabaseQuery<T>()` hook that fetches data from a Supabase table with optional filters, ordering, and returns `{ data, loading, error }`
2. THE Hook_Layer SHALL provide a `useSupabaseRow<T>()` hook that fetches a single row by ID from a Supabase table and returns `{ data, loading, error }`
3. WHEN data changes in the database, THE Realtime_Module SHALL update subscribed hooks via Supabase Realtime subscriptions
4. THE Hook_Layer SHALL support passing custom query builders (filters, ordering, joins) similar to the current Firestore query options
5. WHEN the hook receives a null path or null query, THE Hook_Layer SHALL return null data and set loading to false

### Requirement 6: Migrate Booking Pages

**User Story:** As a user, I want to browse clubs, select time slots, and complete bookings using the new backend.

#### Acceptance Criteria

1. WHEN the booking list page loads, THE Database_Module SHALL fetch all active clubs from the `clubs` table
2. WHEN a user selects a club and date, THE Database_Module SHALL fetch bookings for that club and date from the `bookings` table to show slot availability
3. WHEN a user selects a club, THE Database_Module SHALL fetch courts from the `courts` table filtered by `club_id`
4. WHEN a user submits a booking, THE Database_Module SHALL insert a new row into the `bookings` table with status 'Chờ xác nhận'
5. WHEN a user submits multiple bookings (multi-day), THE Database_Module SHALL insert all rows in a single transaction using Supabase RPC or batch insert

### Requirement 7: Migrate Admin Dashboard

**User Story:** As an admin, I want to manage clubs, bookings, users, news, and settings through the admin dashboard using the new backend.

#### Acceptance Criteria

1. WHEN an admin views the dashboard, THE Database_Module SHALL fetch statistics (bookings count, revenue) from the `bookings` table using Supabase queries
2. WHEN an admin creates/updates/deletes a club, THE Database_Module SHALL perform the corresponding operation on the `clubs` table
3. WHEN an admin creates/updates/deletes a court, THE Database_Module SHALL perform the corresponding operation on the `courts` table
4. WHEN an admin updates a booking status, THE Database_Module SHALL update the `status` column in the `bookings` table
5. WHEN an admin creates a staff or club owner user, THE system SHALL use a server-side API route with Supabase Admin API to create the auth user and insert the profile into the `users` table
6. WHEN an admin locks/unlocks a user, THE Database_Module SHALL update the `is_locked` column in the `users` table
7. WHEN an admin manages news articles, THE Database_Module SHALL perform CRUD operations on the `news` table
8. WHEN an admin manages news tags or club types, THE Database_Module SHALL perform CRUD operations on the `news_tags` and `club_types` tables

### Requirement 8: Migrate News Pages

**User Story:** As a user, I want to browse and read news articles from the new backend.

#### Acceptance Criteria

1. WHEN the news page loads, THE Database_Module SHALL fetch all news articles ordered by `created_at` descending from the `news` table
2. WHEN a user filters by tag, THE Database_Module SHALL filter articles where the `tags` array contains the selected tag
3. WHEN a user views a news detail page, THE Database_Module SHALL fetch a single article by ID from the `news` table
4. THE Database_Module SHALL fetch all news tags from the `news_tags` table for the tag filter UI

### Requirement 9: Migrate User Profile và My Bookings

**User Story:** As a logged-in user, I want to view my profile and booking history from the new backend.

#### Acceptance Criteria

1. WHEN a logged-in user visits the account page, THE Database_Module SHALL fetch the user profile from the `users` table using the authenticated user's ID
2. WHEN a logged-in user visits my-bookings page, THE Database_Module SHALL fetch bookings where `user_id` matches the authenticated user's ID
3. WHEN a user registers a new account, THE Database_Module SHALL insert a new row into the `users` table with role 'customer'

### Requirement 10: Migrate Club Registration

**User Story:** As a club owner, I want to register my club through the registration form using the new backend.

#### Acceptance Criteria

1. WHEN a user submits the club registration form, THE Database_Module SHALL insert a new row into the `clubs` table with `is_active` set to false and `verification_status` set to 'pending'

### Requirement 11: Cập nhật Type Definitions

**User Story:** As a developer, I want updated TypeScript types that reflect the new Supabase/PostgreSQL data structure.

#### Acceptance Criteria

1. THE type definitions SHALL replace `Timestamp` from `firebase/firestore` with `string` (ISO 8601 format) for all date/time fields
2. THE type definitions SHALL use `string` (UUID) for all ID fields instead of Firestore document IDs
3. THE type definitions SHALL maintain backward compatibility with existing component props and rendering logic

### Requirement 12: Cleanup Firebase Dependencies

**User Story:** As a developer, I want to remove all Firebase-related code and dependencies, so that the codebase is clean and only uses Supabase.

#### Acceptance Criteria

1. THE system SHALL remove the entire `src/firebase/` directory
2. THE system SHALL remove Firebase packages (`firebase`) from `package.json`
3. THE system SHALL remove `firestore.rules` and `storage.rules` files
4. THE system SHALL remove `src/firebase/config.ts` with Firebase configuration
5. THE system SHALL install `@supabase/supabase-js` and `@supabase/ssr` packages
