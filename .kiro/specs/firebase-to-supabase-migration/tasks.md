# Implementation Plan: Firebase to Supabase Migration

## Overview

Migration từng layer từ dưới lên: setup Supabase client → tạo schema SQL → cài hooks mới → migrate từng page → cleanup Firebase. Mỗi bước đảm bảo app vẫn chạy được.

## Tasks

- [x] 1. Setup Supabase client và Provider
  - [x] 1.1 Install `@supabase/supabase-js` và `@supabase/ssr` packages
    - Run `npm install @supabase/supabase-js @supabase/ssr`
    - _Requirements: 1.1, 12.5_
  - [x] 1.2 Create Supabase browser client utility (`src/supabase/client.ts`)
    - Use `createBrowserClient` from `@supabase/ssr`
    - Read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env
    - _Requirements: 1.1_
  - [x] 1.3 Create Supabase server client utility (`src/supabase/server.ts`)
    - Use `createServerClient` from `@supabase/ssr` with cookie handling
    - _Requirements: 1.1_
  - [x] 1.4 Create Supabase admin client utility (`src/supabase/admin.ts`)
    - Use `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`
    - For server-side admin operations only
    - _Requirements: 2.6_
  - [x] 1.5 Create SupabaseProvider context and `useSupabase()` hook (`src/supabase/provider.tsx`)
    - Replace `FirebaseProvider` pattern
    - Export `useSupabase()` hook returning SupabaseClient
    - _Requirements: 1.2, 1.3_
  - [x] 1.6 Create phone-to-email utility functions (`src/lib/auth-utils.ts`)
    - Implement `phoneToEmail(phone)` and `emailToPhone(email)`
    - _Requirements: 2.1, 2.2_
  - [ ]* 1.7 Write property test for phone-to-email round trip
    - **Property 1: Phone-to-email transformation is reversible**
    - **Validates: Requirements 2.1, 2.2**

- [x] 2. Create PostgreSQL schema and RLS policies
  - [x] 2.1 Create SQL migration file (`supabase/migrations/001_initial_schema.sql`)
    - Define all 7 tables: `users`, `clubs`, `courts`, `bookings`, `news`, `news_tags`, `club_types`
    - Include indexes, foreign keys, and default values
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 2.2 Create RLS policies SQL file (`supabase/migrations/002_rls_policies.sql`)
    - Define helper functions: `get_user_role()`, `is_admin()`, `manages_club()`
    - Define all RLS policies per design document
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [x] 3. Checkpoint - Verify Supabase setup
  - Run SQL migrations against Supabase project
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create Supabase hooks layer
  - [x] 4.1 Create `useUser()` hook (`src/supabase/auth/use-user.tsx`)
    - Listen to `supabase.auth.onAuthStateChange()`
    - Return `{ user, loading }` matching current Firebase hook interface
    - _Requirements: 2.4, 2.5_
  - [x] 4.2 Create `useSupabaseQuery<T>()` hook (`src/supabase/hooks/use-query.tsx`)
    - Accept table name, optional query builder function, optional realtime flag
    - Return `{ data: T[] | null, loading, error }`
    - Support Supabase Realtime subscriptions via `postgres_changes`
    - Handle null table name by returning null data
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  - [x] 4.3 Create `useSupabaseRow<T>()` hook (`src/supabase/hooks/use-row.tsx`)
    - Accept table name and row ID
    - Return `{ data: T | null, loading, error }`
    - Handle null table/id by returning null data
    - _Requirements: 5.2, 5.5_
  - [x] 4.4 Create Supabase barrel export (`src/supabase/index.ts`)
    - Export all hooks and utilities: `useSupabase`, `useUser`, `useSupabaseQuery`, `useSupabaseRow`, `createClient`
    - _Requirements: 1.3_

- [x] 5. Update TypeScript types
  - [x] 5.1 Update `src/lib/types.ts`
    - Remove `import { Timestamp } from 'firebase/firestore'`
    - Replace `Timestamp` fields with `string` (ISO 8601)
    - Convert camelCase field names to snake_case to match PostgreSQL columns
    - Add type aliases for backward compatibility where needed
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 6. Migrate Authentication pages
  - [x] 6.1 Update root layout (`src/app/layout.tsx`)
    - Replace `FirebaseClientProvider` with `SupabaseProvider`
    - Remove `FirebaseErrorListener`
    - _Requirements: 1.2_
  - [x] 6.2 Migrate login page (`src/app/login/page.tsx`)
    - Replace `signInWithEmailAndPassword` with `supabase.auth.signInWithPassword()`
    - Replace `createUserWithEmailAndPassword` with `supabase.auth.signUp()`
    - Use `phoneToEmail()` utility for email format
    - On register, insert user profile into `users` table
    - _Requirements: 2.1, 2.2, 9.3_
  - [x] 6.3 Migrate account page (`src/app/(tabs)/account/page.tsx`)
    - Replace `signOut(auth)` with `supabase.auth.signOut()`
    - Replace `useDoc<UserProfile>` with `useSupabaseRow('users', user.id)`
    - _Requirements: 2.3, 9.1_
  - [x] 6.4 Migrate header component (`src/components/header.tsx`)
    - Replace Firebase auth imports with Supabase equivalents
    - Replace `signOut(auth)` with `supabase.auth.signOut()`
    - _Requirements: 2.3_

- [x] 7. Checkpoint - Verify auth flow
  - Ensure login, register, logout work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Migrate Booking pages
  - [x] 8.1 Migrate booking list page (`src/app/(tabs)/booking/page.tsx`)
    - Replace `useCollection<Club>('clubs')` with `useSupabaseQuery('clubs')`
    - Replace `useCollection<ClubType>('clubTypes')` with `useSupabaseQuery('club_types')`
    - Replace `useDoc<UserProfile>` with `useSupabaseRow('users', user?.id)`
    - _Requirements: 6.1_
  - [x] 8.2 Migrate booking detail page (`src/app/booking/[clubId]/page.tsx`)
    - Replace `useDoc<Club>` with `useSupabaseRow('clubs', clubId)`
    - Replace `useCollection<Court>('clubs/{id}/courts')` with `useSupabaseQuery('courts', q => q.eq('club_id', clubId))`
    - Replace Firestore booking query with Supabase query: `q => q.eq('date', dateStr).eq('club_id', clubId)`
    - _Requirements: 6.2, 6.3_
  - [x] 8.3 Migrate payment page (`src/app/payment/page.tsx`)
    - Replace `addDoc(collection(firestore, 'bookings'), ...)` with `supabase.from('bookings').insert(...)`
    - Replace `writeBatch()` with `supabase.from('bookings').insert([...rows])`
    - Replace `useDoc<Club>` and `useCollection<Court>` with Supabase equivalents
    - Remove `serverTimestamp()` usage (handled by DB default)
    - _Requirements: 6.4, 6.5_
  - [x] 8.4 Migrate my-bookings page (`src/app/(tabs)/my-bookings/page.tsx`)
    - Replace Firestore query `where('userId', '==', user.uid)` with `q => q.eq('user_id', user.id)`
    - Replace `useCollection<Court>` with Supabase equivalent
    - _Requirements: 9.2_

- [x] 9. Migrate News pages
  - [x] 9.1 Migrate news list page (`src/app/(tabs)/news/page.tsx`)
    - Replace Firestore query with `useSupabaseQuery('news', q => q.order('created_at', { ascending: false }))`
    - Replace `useCollection<NewsTag>('newsTags')` with `useSupabaseQuery('news_tags')`
    - Update `createdAt.toDate()` references to direct `new Date(created_at)` parsing
    - _Requirements: 8.1, 8.2, 8.4_
  - [x] 9.2 Migrate news detail page (`src/app/news/[id]/page.tsx`)
    - Replace `useDoc<NewsArticle>('news/{id}')` with `useSupabaseRow('news', id)`
    - Update timestamp rendering
    - _Requirements: 8.3_

- [x] 10. Migrate Club Registration page
  - [x] 10.1 Migrate register-club page (`src/app/register-club/page.tsx`)
    - Replace `addDoc(collection(firestore, 'clubs'), ...)` with `supabase.from('clubs').insert(...)`
    - Remove `serverTimestamp()` usage
    - _Requirements: 10.1_

- [x] 11. Checkpoint - Verify public pages
  - Ensure booking, news, club registration pages work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Migrate Admin Dashboard
  - [x] 12.1 Create server-side API route for admin user creation (`src/app/api/admin/create-user/route.ts`)
    - Use Supabase Admin client with service_role key
    - Accept email, password, role, managedClubIds
    - Create auth user + insert into users table
    - _Requirements: 2.6, 7.5_
  - [x] 12.2 Migrate admin page - Auth and data fetching (`src/app/admin/page.tsx`)
    - Replace all Firebase auth imports (`signInWithEmailAndPassword`, `signOut`, `createUserWithEmailAndPassword`, etc.)
    - Replace all `useCollection` and `useDoc` calls with Supabase equivalents
    - Replace all Firestore query builders with Supabase query builders
    - _Requirements: 7.1_
  - [x] 12.3 Migrate admin page - Club CRUD operations
    - Replace `addDoc`, `updateDoc`, `deleteDoc` for clubs with Supabase operations
    - Replace `setDoc` for courts with `supabase.from('courts').upsert()`
    - _Requirements: 7.2, 7.3_
  - [x] 12.4 Migrate admin page - Booking management
    - Replace `updateDoc` for booking status with `supabase.from('bookings').update()`
    - Replace `deleteDoc` for bookings with `supabase.from('bookings').delete()`
    - Replace batch operations with Supabase batch insert
    - _Requirements: 7.4_
  - [x] 12.5 Migrate admin page - User management (staff/club owners)
    - Replace client-side Firebase user creation with API call to `/api/admin/create-user`
    - Replace `updateDoc` for user lock/unlock with Supabase update
    - Replace `sendPasswordResetEmail` with Supabase equivalent
    - _Requirements: 7.5, 7.6_
  - [x] 12.6 Migrate admin page - News, Tags, ClubTypes management
    - Replace all Firestore CRUD for news, newsTags, clubTypes with Supabase operations
    - _Requirements: 7.7, 7.8_
  - [x] 12.7 Migrate admin news form (`src/app/admin/news/news-form.tsx`)
    - Replace `useCollection<NewsTag>('newsTags')` with Supabase equivalent
    - _Requirements: 7.7_
  - [x] 12.8 Migrate admin news create/edit pages
    - Update `src/app/admin/news/new/page.tsx` and `src/app/admin/news/[id]/edit/page.tsx`
    - Replace Firestore operations with Supabase equivalents
    - _Requirements: 7.7_

- [x] 13. Checkpoint - Verify admin dashboard
  - Ensure all admin CRUD operations work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Cleanup Firebase dependencies
  - [x] 14.1 Remove Firebase source files
    - Delete entire `src/firebase/` directory
    - Delete `src/components/FirebaseErrorListener.tsx`
    - Delete `firestore.rules` and `storage.rules`
    - _Requirements: 12.1, 12.3, 12.4_
  - [x] 14.2 Remove Firebase packages and update imports
    - Run `npm uninstall firebase`
    - Remove any remaining Firebase imports across the codebase
    - _Requirements: 12.2_
  - [x] 14.3 Update environment variables
    - Remove Firebase-related env vars from `.env.example` if no longer needed
    - Ensure Supabase env vars are documented
    - _Requirements: 1.1_

- [x] 15. Final checkpoint
  - Verify entire application works end-to-end with Supabase
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The admin page (task 12) is the largest migration effort due to its comprehensive CRUD operations
- Courts are now a top-level table instead of a Firestore subcollection, requiring query pattern changes
- Timestamp handling changes from `Timestamp.toDate()` to `new Date(string)` throughout
