# Implementation Plan: Multi-Tenant Subdomain

## Overview

Triển khai hệ thống multi-tenant subdomain cho Sport Booking, cho phép mỗi câu lạc bộ có subdomain riêng. Implementation theo thứ tự: database → core utilities → middleware → UI components → admin config.

## Tasks

- [x] 1. Database migration và core types
  - [x] 1.1 Create Supabase migration `014_custom_subdomain.sql` adding `custom_subdomain` column to clubs table with unique index and CHECK constraint
    - Add nullable `custom_subdomain` TEXT column
    - Create unique index `idx_clubs_custom_subdomain` WHERE custom_subdomain IS NOT NULL
    - Add CHECK constraint for format validation `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$` and max length 63
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 1.2 Update `Club` type in `src/lib/types.ts` to include `custom_subdomain?: string | null`
    - _Requirements: 5.1_

- [x] 2. Tenant context module
  - [x] 2.1 Create `src/lib/tenant.ts` with TenantContext interface, serialization/deserialization functions, subdomain validation, and reserved subdomain check
    - `TenantContext` interface with `clubId`, `clubName`, `subdomain`
    - `serializeTenantContext(ctx)` → JSON string
    - `deserializeTenantContext(header)` → TenantContext | null
    - `getTenantContext()` → reads from `headers()` API
    - `isReservedSubdomain(subdomain)` → boolean
    - `isValidSubdomain(value)` → boolean
    - `extractSubdomain(hostname, baseDomain)` → string | null
    - _Requirements: 1.1, 1.4, 2.1, 7.1, 7.2, 7.3_
  - [x]* 2.2 Write property tests for subdomain extraction (Property 1)
    - **Property 1: Subdomain extraction correctness**
    - **Validates: Requirements 1.1**
  - [x]* 2.3 Write property tests for reserved subdomain exclusion (Property 2)
    - **Property 2: Reserved subdomain exclusion**
    - **Validates: Requirements 1.4**
  - [x]* 2.4 Write property tests for subdomain format validation (Property 3)
    - **Property 3: Subdomain format validation**
    - **Validates: Requirements 2.1, 5.2**
  - [x]* 2.5 Write property test for tenant context round-trip serialization (Property 5)
    - **Property 5: Tenant context serialization round-trip**
    - **Validates: Requirements 7.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Middleware enhancement
  - [x] 4.1 Create `src/supabase/middleware.ts` with lightweight Supabase client for middleware use
    - Use `createClient` with anon key (no auth needed for public club lookup)
    - _Requirements: 1.1, 1.2_
  - [x] 4.2 Update `src/middleware.ts` to add subdomain detection and tenant context routing
    - Extract subdomain from hostname
    - Skip reserved subdomains (use existing logic)
    - Query club by `custom_subdomain` using middleware Supabase client
    - Set `x-tenant-context` header via `NextResponse.rewrite()`
    - Redirect to `app.sportbooking.online` if subdomain not found
    - Handle localhost development (support `{subdomain}.localhost:3000`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 4.3 Write unit tests for middleware routing branches
    - Test reserved subdomain handling
    - Test club subdomain resolution
    - Test unknown subdomain redirect
    - Test localhost passthrough
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Tenant context provider and hooks
  - [x] 5.1 Create `src/components/tenant-provider.tsx` with TenantProvider React context
    - Server-side: read `x-tenant-context` header
    - Client-side: provide via React context
    - _Requirements: 3.1, 7.2_
  - [x] 5.2 Create `src/hooks/use-tenant.ts` client hook to consume tenant context
    - _Requirements: 3.1_
  - [x] 5.3 Integrate TenantProvider into `src/app/layout.tsx`
    - Read tenant context from headers in root layout
    - Wrap children with TenantProvider
    - _Requirements: 3.1, 7.2_

- [x] 6. Tenant-scoped app experience
  - [x] 6.1 Update `src/components/header.tsx` to show club name and logo when tenant context is present
    - _Requirements: 3.2, 3.4_
  - [x] 6.2 Update booking page `src/app/(tabs)/booking/page.tsx` to skip club selection when tenant context is present
    - _Requirements: 3.3_
  - [x] 6.3 Update `src/app/(tabs)/my-bookings/page.tsx` to filter bookings by tenant club ID
    - _Requirements: 3.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Admin subdomain configuration
  - [x] 8.1 Update `src/app/admin/_components/schemas.ts` to add `customSubdomain` field to club schema with Zod validation
    - Regex validation, max length, optional/empty string
    - _Requirements: 2.1, 2.3_
  - [x] 8.2 Update `src/app/admin/_components/club-manager.tsx` ClubFormDialog to add subdomain input field
    - Input field with validation feedback
    - Preview URL display
    - Uniqueness check before save (query Supabase)
    - Reserved subdomain check
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 8.3 Update admin dashboard to scope to tenant club when tenant context is present
    - Hide club selector for club_owner on tenant subdomain
    - System admin retains full access
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Vercel and DNS configuration documentation
  - [x] 9.1 Update `docs/multi-domain-setup.md` with wildcard domain configuration instructions
    - DNS: `*.sportbooking.online` CNAME to `cname.vercel-dns.com`
    - Vercel: add `*.sportbooking.online` as project domain
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. Next.js configuration update
  - [x] 10.1 Update `next.config.ts` to add `serverActions.allowedOrigins` for wildcard subdomain support
    - Add `*.sportbooking.online` pattern to allowed origins
    - _Requirements: 6.3_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (fast-check)
- Unit tests validate specific examples and edge cases
- Database migration should be applied first before any code changes
