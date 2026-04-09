# Requirements Document

## Introduction

Tính năng "Đặt lịch sự kiện" cho phép chủ sân tạo và quản lý các sự kiện thể thao tại câu lạc bộ. Người dùng có thể xem danh sách sự kiện theo ngày, đăng ký tham gia sự kiện, và upload bằng chứng thanh toán. Tính năng này bổ sung song song với luồng "Đặt lịch trực quan" (schedule grid) hiện tại.

## Glossary

- **Event**: Một sự kiện thể thao được tạo bởi chủ sân hoặc admin, bao gồm thông tin về thời gian, sân, số người tham gia, giá vé.
- **Club_Owner**: Chủ sân, người có quyền tạo và quản lý sự kiện cho câu lạc bộ mình quản lý.
- **Admin**: Quản trị viên hệ thống, có quyền quản lý tất cả sự kiện.
- **User**: Người dùng cuối, có thể xem và đăng ký tham gia sự kiện.
- **Event_Registration**: Bản ghi đăng ký tham gia sự kiện của một người dùng.
- **Booking_Type_Selector**: Popup hiển thị khi user chọn club, cho phép chọn giữa "Đặt lịch trực quan" và "Đặt lịch sự kiện".
- **Event_List_Page**: Trang hiển thị danh sách sự kiện theo ngày của một club.
- **Event_Confirmation_Page**: Trang xác nhận đăng ký sự kiện, bao gồm thông tin sự kiện và form upload bằng chứng thanh toán.
- **Visual_Booking**: Luồng đặt lịch trực quan hiện tại sử dụng schedule grid.

## Requirements

### Requirement 1: Chọn loại đặt lịch

**User Story:** As a User, I want to choose between visual booking and event booking when selecting a club, so that I can access the appropriate booking flow.

#### Acceptance Criteria

1. WHEN a User selects a club from the club list, THE Booking_Type_Selector SHALL display a popup with two options: "Đặt lịch trực quan" and "Đặt lịch sự kiện"
2. WHEN a User selects "Đặt lịch trực quan", THE System SHALL navigate to the existing schedule grid page for that club
3. WHEN a User selects "Đặt lịch sự kiện", THE System SHALL navigate to the Event_List_Page for that club

### Requirement 2: Hiển thị danh sách sự kiện

**User Story:** As a User, I want to view events for a specific club organized by date, so that I can find events I want to join.

#### Acceptance Criteria

1. WHEN a User navigates to the Event_List_Page, THE System SHALL display a list of upcoming events for the selected club filtered by date
2. THE Event_List_Page SHALL display each event with: tên sự kiện, ngày tổ chức, số thành viên tham gia (current/max format, e.g. "8/10"), sân tham gia, giá vé, và thể loại tham gia
3. WHEN an event has reached maximum participants, THE System SHALL display the event as full and disable the registration button
4. THE Event_List_Page SHALL only display events that have not yet occurred (event date is in the future or today)
5. WHEN a User taps the "Tham gia" button on an event, THE System SHALL navigate to the Event_Confirmation_Page for that event

### Requirement 3: Xác nhận đăng ký sự kiện

**User Story:** As a User, I want to confirm my event registration with my details and payment proof, so that the club owner can verify my participation.

#### Acceptance Criteria

1. THE Event_Confirmation_Page SHALL display event information: tên sự kiện, ngày tổ chức, sân, giá vé, số người tham gia, và thể loại tham gia
2. THE Event_Confirmation_Page SHALL provide input fields for: tên người đăng ký và số điện thoại
3. THE Event_Confirmation_Page SHALL provide an image upload area for payment proof (similar to the existing Visual_Booking payment flow)
4. WHEN a User submits the registration form, THE System SHALL create an Event_Registration record and a corresponding booking record with status "Sự kiện"
5. WHEN a User submits the registration form with missing required fields (name, phone), THE System SHALL display validation errors and prevent submission
6. WHEN registration is successful, THE System SHALL navigate back to the my-bookings list page

### Requirement 4: Phân biệt loại booking trong danh sách

**User Story:** As a User, I want to distinguish between visual bookings and event bookings in my booking list, so that I can easily identify each type.

#### Acceptance Criteria

1. THE my-bookings page SHALL display a visual indicator (badge or icon) to differentiate event bookings from visual bookings
2. WHEN a booking has status "Sự kiện", THE System SHALL render the booking card with event-specific information (event name, participant count)

### Requirement 5: Quản lý sự kiện (Admin/Club Owner)

**User Story:** As a Club_Owner or Admin, I want to create and manage events for my clubs, so that I can organize activities and attract participants.

#### Acceptance Criteria

1. THE Admin dashboard SHALL include an "Sự kiện" menu item accessible to Admin and Club_Owner roles
2. WHEN a Club_Owner creates an event, THE System SHALL require: tên sự kiện, ngày tổ chức, sân, tổng số người tham gia, giá vé, thể loại tham gia, và ghi chú
3. WHEN a Club_Owner edits an event that has not yet occurred, THE System SHALL allow modifications to all event fields
4. WHEN a Club_Owner attempts to edit an event that has already occurred, THE System SHALL prevent editing
5. WHEN an event date has passed, THE System SHALL automatically set the event status to cancelled
6. THE event management page SHALL display the list of participants registered for each event

### Requirement 6: Hiển thị người tham gia sự kiện trong booking manager

**User Story:** As a Club_Owner or Admin, I want to see event participants in the booking manager with a distinguishing column, so that I can manage all bookings in one place.

#### Acceptance Criteria

1. THE Booking_Manager SHALL display event registrations alongside regular bookings
2. THE Booking_Manager SHALL include a column or indicator to distinguish event registrations from visual bookings
3. WHEN filtering bookings, THE Booking_Manager SHALL support filtering by booking type (visual booking vs event registration)

### Requirement 7: Lưu trữ dữ liệu sự kiện

**User Story:** As a system architect, I want event data to be stored consistently with the existing data model, so that the system remains maintainable.

#### Acceptance Criteria

1. THE System SHALL store events in a dedicated "events" table with fields: id, club_id, event_name, event_date, court_id, max_participants, ticket_price, activity_type, notes, status, created_by, created_at
2. THE System SHALL store event registrations as booking records with status "Sự kiện" and a reference to the event_id
3. WHEN querying participant count for an event, THE System SHALL count non-cancelled booking records referencing that event_id
