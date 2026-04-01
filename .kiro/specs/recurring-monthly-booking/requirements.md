# Requirements Document

## Introduction

Tính năng cho phép admin/chủ sân tạo lịch đặt sân cố định lặp lại theo tuần trong một tháng cụ thể. Phục vụ nhu cầu khách quen đặt sân định kỳ (ví dụ: mỗi Thứ 4 và Thứ 5 từ 20h–22h). Hệ thống hỗ trợ tạo lịch thủ công hoặc tự động vào đầu mỗi tháng.

## Glossary

- **Recurring_Config**: Cấu hình lịch cố định, bao gồm tháng áp dụng, các ngày trong tuần, khung giờ và sân tương ứng
- **Schedule_Entry**: Một mục trong cấu hình, gồm ngày trong tuần (0–6), court_id, và danh sách khung giờ
- **Admin**: Người dùng có role admin hoặc club_owner quản lý câu lạc bộ
- **Booking**: Bản ghi đặt sân trong bảng bookings hiện tại (UserBooking)
- **Club**: Câu lạc bộ thể thao trong hệ thống
- **Court**: Sân thuộc một câu lạc bộ

## Requirements

### Requirement 1: Tạo cấu hình lịch cố định

**User Story:** As an Admin, I want to create a recurring booking configuration for a club, so that I can set up weekly repeating schedules for regular customers.

#### Acceptance Criteria

1. THE Recurring_Config SHALL store the following fields: club_id, month (yyyy-MM format), customer name, customer phone, and a list of Schedule_Entry items
2. WHEN an Admin creates a Recurring_Config, THE System SHALL validate that each Schedule_Entry contains a valid day_of_week (0–6), a valid court_id belonging to the club, and at least one time slot
3. WHEN an Admin creates a Recurring_Config, THE System SHALL validate that the month field is the current month or a future month
4. THE System SHALL allow different courts to be assigned to different days of the week within the same Recurring_Config
5. WHEN an Admin saves a Recurring_Config, THE System SHALL persist it to the recurring_booking_configs table in Supabase

### Requirement 2: Tạo lịch thủ công từ cấu hình

**User Story:** As an Admin, I want to manually generate bookings from a recurring configuration, so that I can create all bookings for a specific month at once.

#### Acceptance Criteria

1. WHEN an Admin triggers manual generation for a Recurring_Config, THE System SHALL calculate all matching dates in the configured month for each day_of_week
2. WHEN generating bookings, THE System SHALL create one booking record per date per Schedule_Entry, with status "Đã xác nhận", the configured customer name and phone, and the correct court and time slots
3. WHEN a time slot on a target date is already booked by another booking, THE System SHALL skip that specific slot and include it in a conflict report
4. WHEN generation completes, THE System SHALL display a summary showing the number of bookings created and any conflicts encountered
5. WHEN generating bookings, THE System SHALL assign a shared booking_group_id to all bookings created from the same Recurring_Config generation run

### Requirement 3: Tự động tạo lịch đầu tháng

**User Story:** As an Admin, I want the system to automatically generate bookings at the start of each month, so that recurring schedules continue without manual intervention.

#### Acceptance Criteria

1. WHERE auto_renew is enabled on a Recurring_Config, THE System SHALL automatically generate bookings for the next month on the first day of that month
2. WHEN auto-generation runs, THE System SHALL follow the same booking creation logic as manual generation (Requirement 2)
3. WHEN auto-generation encounters conflicts, THE System SHALL log the conflicts and create a notification for the Admin
4. WHEN auto-generation completes, THE System SHALL update the Recurring_Config month field to the newly generated month

### Requirement 4: Quản lý cấu hình lịch cố định

**User Story:** As an Admin, I want to view, edit, and delete recurring configurations, so that I can manage recurring schedules over time.

#### Acceptance Criteria

1. THE System SHALL display a list of all Recurring_Configs for the clubs managed by the Admin
2. WHEN an Admin edits a Recurring_Config, THE System SHALL allow modifying schedule entries, customer info, and auto_renew setting
3. WHEN an Admin edits a Recurring_Config, THE System SHALL only affect future generations and not modify already-created bookings
4. WHEN an Admin deletes a Recurring_Config, THE System SHALL soft-delete the configuration and not remove already-created bookings
5. THE System SHALL display the generation status of each Recurring_Config (pending, generated, partially_generated)

### Requirement 5: Xử lý xung đột lịch

**User Story:** As an Admin, I want to see and resolve booking conflicts when generating recurring schedules, so that I can handle overlapping bookings appropriately.

#### Acceptance Criteria

1. WHEN a conflict is detected during generation, THE System SHALL identify the conflicting booking by name, phone, date, time, and court
2. WHEN conflicts exist after generation, THE System SHALL present a conflict summary dialog to the Admin
3. IF an Admin chooses to force-book a conflicting slot, THEN THE System SHALL cancel the existing booking for that slot and create the recurring booking instead
4. THE System SHALL never create duplicate bookings for the same court, date, and time slot

### Requirement 6: Tính giá cho lịch cố định

**User Story:** As an Admin, I want recurring bookings to use the club's pricing configuration, so that the total price is calculated correctly.

#### Acceptance Criteria

1. WHEN creating bookings from a Recurring_Config, THE System SHALL calculate the price for each slot using the club's existing pricing tiers (weekday/weekend, time-based)
2. THE System SHALL set the total_price on each generated booking based on the sum of its slot prices
