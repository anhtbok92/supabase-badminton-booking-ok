# Requirements Document

## Introduction

Hệ thống multi-tenant subdomain cho phép mỗi câu lạc bộ (club) có subdomain riêng trên nền tảng Sport Booking. Ví dụ: `caulonglinhdam.sportbooking.online` sẽ hiển thị app với branding riêng của club đó. Hệ thống vẫn giữ nguyên `app.sportbooking.online` cho các club không muốn subdomain riêng. Admin có thể cấu hình subdomain cho từng club.

## Glossary

- **Tenant**: Một câu lạc bộ (club) có subdomain riêng trên hệ thống
- **Subdomain**: Phần prefix của domain, ví dụ `caulonglinhdam` trong `caulonglinhdam.sportbooking.online`
- **Middleware**: Next.js middleware xử lý routing dựa trên hostname
- **Club_Branding**: Tập hợp thông tin thương hiệu của club bao gồm tên, logo, màu chủ đạo
- **Tenant_Context**: Thông tin club hiện tại được truyền qua request headers hoặc context cho toàn bộ ứng dụng
- **Wildcard_Domain**: Cấu hình DNS `*.sportbooking.online` cho phép mọi subdomain trỏ về cùng một ứng dụng
- **Reserved_Subdomain**: Các subdomain hệ thống không được phép sử dụng cho club (app, www, api, admin)

## Requirements

### Requirement 1: Subdomain Resolution

**User Story:** As a user, I want to access a club's app via its subdomain, so that I can have a branded experience specific to that club.

#### Acceptance Criteria

1. WHEN a request arrives at `{subdomain}.sportbooking.online`, THE Middleware SHALL extract the subdomain and resolve it to the corresponding club record in the database
2. WHEN the subdomain matches an active club with a configured subdomain, THE Middleware SHALL set the Tenant_Context with the club's ID and proceed to render the app
3. WHEN the subdomain does not match any active club, THE Middleware SHALL redirect the user to `app.sportbooking.online`
4. WHILE a request is on a reserved subdomain (app, www, api, admin), THE Middleware SHALL treat the request using existing routing logic without tenant resolution
5. WHEN a request arrives at `app.sportbooking.online`, THE Middleware SHALL continue to serve the multi-club app as it does currently

### Requirement 2: Subdomain Configuration by Admin

**User Story:** As an admin, I want to configure a custom subdomain for a club, so that the club can have its own branded URL.

#### Acceptance Criteria

1. WHEN an admin sets a subdomain for a club, THE Club_Manager SHALL validate that the subdomain contains only lowercase alphanumeric characters and hyphens
2. WHEN an admin sets a subdomain for a club, THE Club_Manager SHALL verify the subdomain is unique across all clubs
3. WHEN an admin sets a subdomain that matches a Reserved_Subdomain, THE Club_Manager SHALL reject the value and display an error message
4. WHEN a subdomain is successfully saved, THE Club_Manager SHALL store the subdomain value in the club record in the database
5. WHEN an admin clears the subdomain field for a club, THE Club_Manager SHALL remove the subdomain association and the club reverts to being accessible only via `app.sportbooking.online`

### Requirement 3: Tenant-Scoped App Experience

**User Story:** As a user visiting a club's subdomain, I want to see only that club's information, so that I have a focused booking experience.

#### Acceptance Criteria

1. WHILE the Tenant_Context contains a club ID, THE App SHALL display only courts, schedules, and bookings belonging to that club
2. WHILE the Tenant_Context contains a club ID, THE App SHALL display the club's name in the header instead of the generic "Sport Booking" branding
3. WHEN a user navigates to the booking page on a club subdomain, THE App SHALL skip the club selection step and go directly to court/time selection
4. WHILE the Tenant_Context contains a club ID, THE App SHALL use the club's logo as the favicon and page icon when available

### Requirement 4: Tenant-Scoped Admin Experience

**User Story:** As a club owner accessing admin via their club's subdomain, I want to manage only my club, so that the admin interface is simplified and focused.

#### Acceptance Criteria

1. WHEN a club owner accesses `{subdomain}.sportbooking.online/admin`, THE Admin_Dashboard SHALL display management tools scoped to that specific club only
2. WHILE the Tenant_Context contains a club ID on the admin route, THE Admin_Dashboard SHALL hide the club selector and multi-club management features
3. WHEN a system admin accesses `{subdomain}.sportbooking.online/admin`, THE Admin_Dashboard SHALL still display the full admin interface with all clubs visible
4. WHEN a user without club_owner or admin role accesses the admin route on a club subdomain, THE Middleware SHALL deny access following existing authorization rules

### Requirement 5: Database Schema for Subdomain

**User Story:** As a developer, I want the subdomain stored in the database with proper constraints, so that subdomain resolution is reliable and fast.

#### Acceptance Criteria

1. THE Database SHALL store a `custom_subdomain` column on the clubs table as a nullable text field with a unique constraint
2. WHEN a subdomain value is inserted or updated, THE Database SHALL validate that the value matches the pattern `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$` with a maximum length of 63 characters
3. THE Database SHALL maintain a unique index on the `custom_subdomain` column for fast lookup during request resolution
4. WHEN a club record is queried by subdomain, THE Database SHALL return the result using the unique index

### Requirement 6: Vercel and DNS Configuration

**User Story:** As a system administrator, I want wildcard domain support configured, so that any club subdomain resolves to the application.

#### Acceptance Criteria

1. THE Deployment_Configuration SHALL include a wildcard DNS record `*.sportbooking.online` pointing to Vercel
2. THE Deployment_Configuration SHALL register `*.sportbooking.online` as a domain in the Vercel project settings
3. WHILE the wildcard domain is active, THE Deployment_Configuration SHALL continue to support the existing `sportbooking.online` and `app.sportbooking.online` domains without disruption

### Requirement 7: Subdomain Serialization

**User Story:** As a developer, I want subdomain data to be serialized and deserialized consistently, so that the tenant context is reliably passed through the request pipeline.

#### Acceptance Criteria

1. WHEN the Middleware resolves a subdomain to a club, THE Middleware SHALL serialize the Tenant_Context as a JSON-encoded request header `x-tenant-context`
2. WHEN a server component or API route reads the Tenant_Context, THE App SHALL deserialize the `x-tenant-context` header back into a structured object
3. FOR ALL valid Tenant_Context objects, serializing then deserializing SHALL produce an equivalent object (round-trip property)
