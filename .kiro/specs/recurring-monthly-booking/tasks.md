# Implementation Plan: Recurring Monthly Booking

## Overview

Triển khai tính năng đặt lịch cố định theo tháng cho admin/chủ sân. Bắt đầu từ data model, core logic, rồi UI, cuối cùng là auto-generation.

## Tasks

- [ ] 1. Set up database and types
  - [ ] 1.1 Create Supabase migration for `recurring_booking_configs` table
    - Create table with columns: id, club_id, customer_name, customer_phone, month, schedule_entries (JSONB), auto_renew, generation_status, is_deleted, created_at, updated_at
    - Add foreign key to clubs table
    - Add RLS policies for admin and club_owner access
    - _Requirements: 1.1, 1.5_
  - [ ] 1.2 Add TypeScript types for RecurringBookingConfig, ScheduleEntry, ConflictInfo, GenerationResult
    - Add to `src/lib/types.ts`
    - _Requirements: 1.1_

- [ ] 2. Implement core generation logic
  - [ ] 2.1 Implement `getDatesForDayInMonth` utility function
    - Create `src/lib/recurring-booking-utils.ts`
    - Given year, month, dayOfWeek → return array of Date objects
    - _Requirements: 2.1_
  - [ ]* 2.2 Write property test for getDatesForDayInMonth
    - **Property 4: getDatesForDayInMonth returns correct dates**
    - **Validates: Requirements 2.1**
  - [ ] 2.3 Implement validation functions for RecurringBookingConfig
    - Validate schedule_entries (day_of_week 0–6, non-empty time_slots)
    - Validate month is current or future
    - Use Zod schema
    - _Requirements: 1.2, 1.3_
  - [ ]* 2.4 Write property tests for validation
    - **Property 2: Schedule entry validation rejects invalid inputs**
    - **Validates: Requirements 1.2**
    - **Property 3: Month validation rejects past months**
    - **Validates: Requirements 1.3**
  - [ ] 2.5 Implement `generateBookingsFromConfig` function
    - Calculate matching dates using getDatesForDayInMonth
    - Check existing bookings for conflicts
    - Create booking objects with correct fields, shared booking_group_id
    - Return GenerationResult with created_count, skipped_count, conflicts
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.1, 5.4_
  - [ ] 2.6 Implement `calculateBookingPrice` using existing getPriceForSlot
    - Sum slot prices for a booking based on club pricing tiers
    - _Requirements: 6.1, 6.2_
  - [ ]* 2.7 Write property tests for generation and pricing
    - **Property 5: Generated bookings have correct fields and shared group_id**
    - **Validates: Requirements 2.2, 2.5**
    - **Property 6: Conflicts are skipped and reported**
    - **Validates: Requirements 2.3, 5.1**
    - **Property 7: No duplicate bookings**
    - **Validates: Requirements 5.4**
    - **Property 9: Price calculation matches slot-level pricing**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 3. Checkpoint - Ensure all core logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement admin UI
  - [ ] 4.1 Create `RecurringBookingManager` component
    - Create `src/app/admin/_components/recurring-booking-manager.tsx`
    - List all recurring configs for the admin's clubs
    - Show generation_status badge for each config
    - Add "Tạo cấu hình mới" button
    - _Requirements: 4.1, 4.5_
  - [ ] 4.2 Create config form dialog
    - Form fields: customer name, phone, month picker, schedule entries (day selector, court selector, time range picker)
    - Allow adding multiple schedule entries with different days/courts
    - Zod validation on submit
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 4.3 Implement generate action with conflict handling
    - "Tạo lịch tháng này" button on each config
    - Call generateBookingsFromConfig
    - Show conflict dialog if conflicts exist (skip or force-book options)
    - Show summary dialog on completion
    - Persist bookings to Supabase
    - Update generation_status on config
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 6.1, 6.2_
  - [ ] 4.4 Implement edit and delete for configs
    - Edit dialog pre-filled with existing config
    - Soft-delete with confirmation
    - _Requirements: 4.2, 4.3, 4.4_
  - [ ] 4.5 Wire RecurringBookingManager into AdminDashboard
    - Add menu item "Lịch cố định" with CalendarClock icon
    - Render component when selected
    - Available for admin and club_owner roles
    - _Requirements: 4.1_

- [ ] 5. Checkpoint - Ensure UI works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement auto-generation
  - [ ] 6.1 Create API route for auto-generation
    - Create `src/app/api/recurring-bookings/generate/route.ts`
    - Query all configs with auto_renew=true and month = previous month
    - Generate bookings for the new month
    - Update config month field after generation
    - Log conflicts as notifications
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 6.2 Write integration test for auto-generation API
    - Test that API generates bookings correctly
    - Test that config month is updated
    - _Requirements: 3.1, 3.4_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The `fast-check` library is used for property-based testing
