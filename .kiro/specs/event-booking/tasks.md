# Implementation Plan: Đặt lịch sự kiện (Event Booking)

## Overview

Triển khai tính năng Event Booking theo thứ tự: data layer → utility functions → admin management → user-facing pages → integration. Mỗi bước build trên bước trước, đảm bảo không có code orphan.

## Tasks

- [x] 1. Database schema và types
  - [x] 1.1 Tạo migration file cho bảng `events` và thêm cột `event_id` vào bảng `bookings`
    - Tạo file `supabase/migrations/016_events.sql`
    - Tạo bảng `events` với các fields: id, club_id, event_name, event_date, court_id, max_participants, ticket_price, activity_type, notes, status, created_by, created_at
    - ALTER TABLE bookings ADD COLUMN event_id UUID REFERENCES events(id)
    - Tạo indexes cho events(club_id), events(event_date), events(status), bookings(event_id)
    - Thêm RLS policies cho bảng events
    - _Requirements: 7.1, 7.2_

  - [x] 1.2 Thêm TypeScript types cho Event và cập nhật UserBooking
    - Thêm `Event` type vào `src/lib/types.ts`
    - Thêm `event_id?: string` vào `UserBooking` type
    - _Requirements: 7.1, 7.2_

- [-] 2. Event utility functions và tests
  - [x] 2.1 Tạo `src/lib/event-utils.ts` với các hàm tiện ích
    - `filterEventsByClubAndDate(events, clubId, date)` - lọc sự kiện theo club và ngày
    - `isEventFull(event, participantCount)` - kiểm tra sự kiện đã đầy chưa
    - `isEventEditable(event)` - kiểm tra sự kiện có thể edit không (dựa trên ngày)
    - `getParticipantCount(bookings, eventId)` - đếm số người tham gia (loại trừ cancelled/deleted)
    - `filterUpcomingEvents(events)` - lọc sự kiện chưa diễn ra
    - `filterBookingsByType(bookings, type)` - lọc booking theo loại (event vs visual)
    - `buildEventBookingRecord(event, formData, userId?)` - tạo booking record từ event registration
    - `validateEventForm(data)` - validate event creation form
    - _Requirements: 2.1, 2.3, 2.4, 3.4, 5.2, 5.3, 5.4, 6.3, 7.3_

  - [ ]* 2.2 Write property tests cho event utility functions
    - Tạo `src/lib/__tests__/event-utils.property.test.ts`
    - **Property 1: Event filtering returns correct club and date range**
    - **Validates: Requirements 2.1**
    - **Property 3: Full events disable registration**
    - **Validates: Requirements 2.3**
    - **Property 4: Only future or today events are displayed**
    - **Validates: Requirements 2.4**
    - **Property 5: Event registration creates correct booking record**
    - **Validates: Requirements 3.4, 7.2**
    - **Property 6: Registration form rejects invalid inputs**
    - **Validates: Requirements 3.5**
    - **Property 8: Event creation requires all mandatory fields**
    - **Validates: Requirements 5.2**
    - **Property 9: Event editability depends on event date**
    - **Validates: Requirements 5.3, 5.4**
    - **Property 11: Booking type filter works correctly**
    - **Validates: Requirements 6.3**
    - **Property 12: Participant count excludes cancelled registrations**
    - **Validates: Requirements 7.3**

  - [ ]* 2.3 Write unit tests cho event utility functions
    - Tạo `src/lib/__tests__/event-utils.test.ts`
    - Test edge cases: empty arrays, null values, boundary dates (today)
    - Test specific examples cho mỗi function
    - _Requirements: 2.1, 2.3, 2.4, 5.3, 5.4, 7.3_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Admin Event Manager
  - [x] 4.1 Tạo `src/app/admin/_components/event-manager.tsx`
    - Danh sách sự kiện với filter theo club, status, search
    - Form tạo/sửa sự kiện (Dialog): tên, ngày, sân, max participants, giá vé, thể loại, ghi chú
    - Chặn edit sự kiện đã diễn ra (dùng `isEventEditable`)
    - Hiển thị danh sách người tham gia cho mỗi sự kiện
    - Validate form với Zod schema (dùng `validateEventForm`)
    - Follow pattern của `booking-manager.tsx` và `club-manager.tsx`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [x] 4.2 Đăng ký Event Manager vào Admin Dashboard
    - Import `EventManager` trong `admin-dashboard.tsx`
    - Thêm nav item "Sự kiện" với icon `CalendarDays` cho roles admin và club_owner
    - Render `EventManager` khi activeView === 'events'
    - _Requirements: 5.1_

- [x] 5. Cập nhật Booking Manager cho event bookings
  - [x] 5.1 Thêm cột/indicator phân biệt loại booking trong `booking-manager.tsx`
    - Thêm cột "Loại" hiển thị badge "Sự kiện" hoặc "Đặt lịch" dựa trên status/event_id
    - Thêm filter dropdown cho booking type (Tất cả / Đặt lịch / Sự kiện)
    - Dùng `filterBookingsByType` utility
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Checkpoint - Ensure admin features work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Booking Type Selector
  - [x] 7.1 Tạo `src/app/(tabs)/booking/_components/booking-type-selector.tsx`
    - Dialog/Sheet component với 2 options: "Đặt lịch trực quan" và "Đặt lịch sự kiện"
    - Props: club (Club object), isOpen, onOpenChange
    - Navigate to `/dat-san/[slug]` cho visual booking
    - Navigate to `/events/[clubId]` cho event booking
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Tích hợp Booking Type Selector vào club list page
    - Sửa `src/app/(tabs)/booking/page.tsx` để hiển thị popup khi chọn club thay vì navigate trực tiếp
    - _Requirements: 1.1_

- [x] 8. Event List Page
  - [x] 8.1 Tạo `src/app/events/[clubId]/page.tsx`
    - Fetch events cho club từ Supabase
    - Fetch participant counts cho mỗi event
    - Horizontal date picker (reuse pattern từ booking page)
    - Event cards: tên, ngày, participants (current/max), sân, giá vé, thể loại, button "Tham gia"
    - Disable "Tham gia" khi event full (dùng `isEventFull`)
    - Filter chỉ hiển thị upcoming events (dùng `filterUpcomingEvents`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Event Confirmation Page
  - [x] 9.1 Tạo `src/app/events/[clubId]/confirm/page.tsx`
    - Hiển thị thông tin sự kiện (tên, ngày, sân, giá vé, participants, thể loại)
    - Form: tên, số điện thoại (Zod validation giống payment page)
    - Upload bằng chứng thanh toán (reuse pattern từ payment page)
    - Hiển thị QR code thanh toán của club
    - Submit: tạo booking record với `buildEventBookingRecord`, insert vào Supabase
    - Navigate to `/my-bookings` sau khi thành công
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 10. Cập nhật My Bookings Page
  - [x] 10.1 Thêm phân biệt event booking trong `my-bookings/page.tsx`
    - Thêm badge "Sự kiện" cho booking có status "Sự kiện"
    - Hiển thị event name nếu có event_id
    - _Requirements: 4.1, 4.2_

- [x] 11. Auto-cancel past events
  - [x] 11.1 Tạo API route hoặc cron job để auto-cancel sự kiện đã qua
    - Tạo `src/app/api/cron/cancel-past-events/route.ts`
    - Query events WHERE status = 'active' AND event_date < today
    - Update status = 'cancelled'
    - _Requirements: 5.5_

  - [ ]* 11.2 Write property test cho auto-cancel logic
    - **Property 10: Past events are automatically cancelled**
    - **Validates: Requirements 5.5**

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Reuse tối đa patterns từ payment page và booking manager hiện có
