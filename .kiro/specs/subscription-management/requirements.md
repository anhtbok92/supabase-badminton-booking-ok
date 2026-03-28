# Requirements Document - Subscription Management System

## Introduction

Hệ thống quản lý gói đăng ký (subscription) cho phép admin thiết lập và quản lý các gói dịch vụ cho câu lạc bộ, bao gồm giới hạn số sân, số booking, và tính phí vượt mức.

## Glossary

- **Subscription_System**: Hệ thống quản lý gói đăng ký
- **Club**: Câu lạc bộ/sân cầu lông
- **Subscription_Plan**: Gói đăng ký (FREE, BASIC, PRO)
- **Booking**: Lượt đặt sân
- **Court**: Sân cầu lông
- **Overage_Fee**: Phí vượt mức khi vượt quota
- **Admin**: Quản trị viên hệ thống
- **Club_Owner**: Chủ sân/câu lạc bộ

## Requirements

### Requirement 1: Quản lý gói đăng ký

**User Story:** As an admin, I want to configure subscription plans with limits, so that I can control resource usage and pricing.

#### Acceptance Criteria

1. THE Subscription_System SHALL support three plan types: FREE, BASIC, and PRO
2. WHEN an admin creates a plan, THE Subscription_System SHALL require plan name, max courts, max bookings per month, and monthly price
3. THE Subscription_System SHALL store plan configuration in the database
4. WHEN an admin updates a plan, THE Subscription_System SHALL apply changes to new subscriptions only
5. THE Subscription_System SHALL display all active plans in the admin panel

### Requirement 2: Gán gói cho câu lạc bộ

**User Story:** As an admin, I want to assign subscription plans to clubs, so that I can control their access and limits.

#### Acceptance Criteria

1. WHEN an admin assigns a plan to a club, THE Subscription_System SHALL record the subscription start date and end date
2. THE Subscription_System SHALL allow admin to change a club's subscription plan
3. WHEN a club is created from partnership registration, THE Subscription_System SHALL automatically assign FREE plan with 3-month trial
4. THE Subscription_System SHALL display current plan and expiry date for each club
5. WHEN a subscription expires, THE Subscription_System SHALL automatically downgrade to FREE plan

### Requirement 3: Giới hạn số sân theo gói

**User Story:** As a system, I want to enforce court limits based on subscription plan, so that clubs cannot exceed their quota.

#### Acceptance Criteria

1. WHEN a club owner tries to create a court, THE Subscription_System SHALL check if current court count is below plan limit
2. IF court count equals or exceeds plan limit, THEN THE Subscription_System SHALL prevent court creation and display upgrade message
3. THE Subscription_System SHALL display current court usage (e.g., "3/10 sân") in the club management interface
4. WHEN a club upgrades their plan, THE Subscription_System SHALL immediately allow more courts to be created
5. WHEN a club downgrades their plan, THE Subscription_System SHALL allow existing courts to remain but prevent new ones until count is below limit

### Requirement 4: Giới hạn số booking theo gói

**User Story:** As a system, I want to track and limit monthly bookings based on subscription plan, so that I can manage costs and encourage upgrades.

#### Acceptance Criteria

1. THE Subscription_System SHALL count bookings per club per calendar month
2. WHEN a booking is created, THE Subscription_System SHALL increment the monthly booking counter
3. WHEN a booking is cancelled, THE Subscription_System SHALL decrement the monthly booking counter
4. THE Subscription_System SHALL reset booking counter on the first day of each month
5. THE Subscription_System SHALL display current booking usage (e.g., "450/1000 bookings") in the club dashboard

### Requirement 5: Xử lý vượt quota booking

**User Story:** As an admin, I want to configure overage fees for bookings exceeding plan limits, so that I can monetize extra usage.

#### Acceptance Criteria

1. WHEN a club reaches their monthly booking limit, THE Subscription_System SHALL allow bookings to continue but mark them as overage
2. THE Subscription_System SHALL calculate overage fees based on configured rate per booking
3. THE Subscription_System SHALL display overage count and total overage fees in the admin panel
4. THE Subscription_System SHALL send notification to club owner when they reach 80%, 90%, and 100% of booking quota
5. THE Subscription_System SHALL generate monthly invoice including base subscription fee and overage fees

### Requirement 6: Thông báo và cảnh báo

**User Story:** As a club owner, I want to receive notifications about my subscription status, so that I can manage my usage and avoid service interruption.

#### Acceptance Criteria

1. WHEN a subscription is 7 days from expiry, THE Subscription_System SHALL send email notification to club owner
2. WHEN a subscription expires, THE Subscription_System SHALL send email notification and downgrade to FREE plan
3. WHEN booking usage reaches 80% of quota, THE Subscription_System SHALL display warning in club dashboard
4. WHEN booking usage reaches 100% of quota, THE Subscription_System SHALL display overage notice with fee information
5. THE Subscription_System SHALL display subscription status badge (Active, Expiring Soon, Expired) in admin panel

### Requirement 7: Báo cáo và thống kê

**User Story:** As an admin, I want to view subscription analytics, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE Subscription_System SHALL display total revenue by plan type (FREE, BASIC, PRO)
2. THE Subscription_System SHALL display total overage revenue
3. THE Subscription_System SHALL show club distribution by plan type
4. THE Subscription_System SHALL calculate and display average bookings per club per plan
5. THE Subscription_System SHALL show monthly recurring revenue (MRR) and annual recurring revenue (ARR)

### Requirement 8: Tính toán giá tối ưu

**User Story:** As an admin, I want the system to suggest optimal pricing based on costs, so that I can maintain target profit margin.

#### Acceptance Criteria

1. THE Subscription_System SHALL calculate Supabase costs based on total storage and bandwidth usage
2. THE Subscription_System SHALL display cost per club by plan type
3. THE Subscription_System SHALL calculate profit margin for each plan
4. WHEN total usage approaches Supabase free tier limits, THE Subscription_System SHALL alert admin
5. THE Subscription_System SHALL suggest when to upgrade Supabase plan based on projected growth

### Requirement 9: Cấu hình gói đăng ký bởi Admin

**User Story:** As an admin, I want to configure subscription plan details (price, limits, overage fees), so that I can adjust business model without code changes.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide admin interface to create and edit subscription plans
2. WHEN admin creates a plan, THE Subscription_System SHALL require: plan name, max courts, max bookings per month, monthly price, yearly price, and overage fee per booking
3. THE Subscription_System SHALL allow admin to enable/disable plans
4. THE Subscription_System SHALL prevent deletion of plans that have active subscriptions
5. THE Subscription_System SHALL display plan configuration in a table with edit and delete actions

### Requirement 10: Tự động tính toán và báo cáo overage

**User Story:** As an admin, I want to receive monthly reports of clubs exceeding their booking quota, so that I can invoice them for overage fees.

#### Acceptance Criteria

1. WHEN a club exceeds their monthly booking quota, THE Subscription_System SHALL calculate overage amount automatically
2. THE Subscription_System SHALL track overage bookings and fees in real-time
3. ON the last day of each month, THE Subscription_System SHALL generate overage report for all clubs
4. THE Subscription_System SHALL send email report to victory1080@gmail.com with: club name, plan, quota, actual bookings, overage count, and overage fee
5. THE Subscription_System SHALL display overage summary in admin dashboard with total revenue from overage fees

### Requirement 11: Giới hạn tạo sân theo gói

**User Story:** As a club owner, I want to see my court limit clearly, so that I know when to upgrade my plan.

#### Acceptance Criteria

1. WHEN a club owner views court management, THE Subscription_System SHALL display current usage (e.g., "3/10 sân")
2. WHEN a club owner tries to create a court beyond their limit, THE Subscription_System SHALL prevent creation and show upgrade message
3. THE Subscription_System SHALL calculate court limit based on club's current subscription plan
4. WHEN admin changes a club's plan, THE Subscription_System SHALL immediately update court limits
5. THE Subscription_System SHALL allow viewing courts but prevent creating new ones when limit is reached

### Requirement 12: Theo dõi booking quota theo tháng

**User Story:** As a club owner, I want to see my monthly booking usage, so that I can manage my quota and avoid overage fees.

#### Acceptance Criteria

1. THE Subscription_System SHALL display booking usage in club dashboard (e.g., "450/1000 bookings tháng này")
2. THE Subscription_System SHALL reset booking counter on the 1st day of each month at 00:00
3. WHEN a booking is created, THE Subscription_System SHALL increment the monthly counter
4. WHEN a booking is cancelled, THE Subscription_System SHALL decrement the monthly counter
5. WHEN booking usage reaches 80%, THE Subscription_System SHALL display warning message to club owner
