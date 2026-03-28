# API Reference - Subscription Management

## Overview

This document describes the API endpoints for the subscription management system.

**Base URL:** `https://your-domain.com/api`

**Authentication:** Most endpoints require admin authentication via session cookie.

---

## Subscription Plans

### List All Plans

**Endpoint:** `GET /admin/subscription-plans`

**Authentication:** Admin required

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "FREE",
      "display_name": "Gói Miễn phí",
      "max_courts": 3,
      "max_bookings_per_month": 100,
      "monthly_price": 0,
      "yearly_price": 0,
      "overage_fee_per_booking": 0,
      "is_active": true,
      "features": {
        "trial_months": 3,
        "support": "email"
      },
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

---

### Create Plan

**Endpoint:** `POST /admin/subscription-plans`

**Authentication:** Admin required

**Request Body:**
```json
{
  "name": "PREMIUM",
  "display_name": "Gói Cao cấp",
  "max_courts": 50,
  "max_bookings_per_month": 5000,
  "monthly_price": 800000,
  "yearly_price": 8000000,
  "overage_fee_per_booking": 1000,
  "features": {
    "support": "priority",
    "analytics": true,
    "custom_features": true
  }
}
```

**Response:**
```json
{
  "plan": {
    "id": "uuid",
    "name": "PREMIUM",
    ...
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Invalid request body
- `401` - Unauthorized
- `409` - Plan name already exists
- `500` - Server error

**Validation Rules:**
- `name` - Required, unique, uppercase
- `display_name` - Required
- `max_courts` - Required, positive integer
- `max_bookings_per_month` - Required, positive integer
- `monthly_price` - Required, non-negative integer
- `yearly_price` - Required, non-negative integer
- `overage_fee_per_booking` - Required, non-negative integer

---

### Update Plan

**Endpoint:** `PUT /admin/subscription-plans/[id]`

**Authentication:** Admin required

**Request Body:**
```json
{
  "display_name": "Gói Cao cấp Plus",
  "monthly_price": 900000,
  "yearly_price": 9000000
}
```

**Response:**
```json
{
  "plan": {
    "id": "uuid",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request body
- `401` - Unauthorized
- `404` - Plan not found
- `500` - Server error

**Notes:**
- Only provided fields are updated
- Changes apply to new subscriptions only
- Existing subscriptions retain original configuration

---

### Delete Plan

**Endpoint:** `DELETE /admin/subscription-plans/[id]`

**Authentication:** Admin required

**Response:**
```json
{
  "message": "Plan deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Plan has active subscriptions (cannot delete)
- `401` - Unauthorized
- `404` - Plan not found
- `500` - Server error

**Notes:**
- Cannot delete plans with active subscriptions
- Must reassign clubs to different plans first
- FREE plan cannot be deleted (system default)

---

## Club Subscriptions

### Assign Subscription to Club

**Endpoint:** `POST /admin/club-subscriptions`

**Authentication:** Admin required

**Request Body:**
```json
{
  "club_id": "uuid",
  "plan_id": "uuid",
  "billing_cycle": "monthly",
  "start_date": "2025-01-01",
  "auto_renew": false
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "club_id": "uuid",
    "plan_id": "uuid",
    "billing_cycle": "monthly",
    "start_date": "2025-01-01",
    "end_date": "2025-02-01",
    "is_active": true,
    "auto_renew": false,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Invalid request body
- `401` - Unauthorized
- `404` - Club or plan not found
- `409` - Club already has active subscription
- `500` - Server error

**Validation Rules:**
- `club_id` - Required, must exist
- `plan_id` - Required, must exist and be active
- `billing_cycle` - Required, must be "monthly" or "yearly"
- `start_date` - Optional, defaults to today
- `auto_renew` - Optional, defaults to false

**End Date Calculation:**
- Monthly: start_date + 1 month
- Yearly: start_date + 1 year

**Side Effects:**
- Deactivates previous subscription (if any)
- Updates `clubs.current_subscription_id`
- Updates `clubs.subscription_status` to "active"

---

### Update Subscription

**Endpoint:** `PUT /admin/club-subscriptions/[id]`

**Authentication:** Admin required

**Request Body:**
```json
{
  "plan_id": "uuid",
  "end_date": "2025-12-31",
  "auto_renew": true
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request body
- `401` - Unauthorized
- `404` - Subscription not found
- `500` - Server error

**Use Cases:**
- Change plan (upgrade/downgrade)
- Extend subscription
- Enable/disable auto-renew
- Cancel subscription (set is_active = false)

---

### Get Club Subscription

**Endpoint:** `GET /admin/club-subscriptions?club_id=[uuid]`

**Authentication:** Admin required

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "club_id": "uuid",
    "plan_id": "uuid",
    "billing_cycle": "monthly",
    "start_date": "2025-01-01",
    "end_date": "2025-02-01",
    "is_active": true,
    "auto_renew": false,
    "plan": {
      "name": "BASIC",
      "display_name": "Gói Cơ bản",
      "max_courts": 10,
      "max_bookings_per_month": 1000,
      ...
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Club has no subscription
- `500` - Server error

---

## Overage Reports

### Generate Overage Report

**Endpoint:** `GET /admin/overage-report?month=2025-01`

**Authentication:** Admin required

**Query Parameters:**
- `month` - Optional, format: YYYY-MM, defaults to current month

**Response:**
```json
{
  "month": "2025-01-01",
  "total_overage_revenue": 500000,
  "clubs": [
    {
      "club_id": "uuid",
      "club_name": "CLB ABC",
      "plan_name": "Gói Cơ bản",
      "quota": 1000,
      "actual_bookings": 1200,
      "overage_count": 200,
      "overage_fee": 400000
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid month format
- `401` - Unauthorized
- `500` - Server error

**Notes:**
- Only includes clubs with overage_count > 0
- Sorted by overage_fee descending
- Used for monthly invoicing

---

## Cron Jobs

### Monthly Overage Report

**Endpoint:** `POST /cron/monthly-report`

**Authentication:** Bearer token (CRON_SECRET)

**Headers:**
```
Authorization: Bearer your-cron-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated and email sent successfully",
  "report": {
    "month": "2025-01-01",
    "total_overage_revenue": 500000,
    "clubs": [...]
  },
  "email_id": "resend-email-id"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid or missing CRON_SECRET)
- `500` - Server error

**Schedule:** Last day of month at 23:00 (11 PM)

**Actions:**
1. Generates overage report for previous month
2. Formats HTML email
3. Sends to configured email address
4. Returns report data

**Manual Testing:**
```bash
# GET endpoint for preview (requires admin auth)
curl https://your-domain.com/api/cron/monthly-report \
  -H "Cookie: your-admin-session-cookie"
```

---

### Daily Subscription Expiry Check

**Endpoint:** `POST /cron/check-subscriptions`

**Authentication:** Bearer token (CRON_SECRET)

**Headers:**
```
Authorization: Bearer your-cron-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription expiry check completed",
  "summary": {
    "total_expiring": 5,
    "total_expired": 2,
    "total_downgraded": 2,
    "expiring_emails_sent": 5,
    "expired_emails_sent": 2
  },
  "details": {
    "expiring_clubs": [...],
    "expired_clubs": [...],
    "downgrade_results": [...]
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid or missing CRON_SECRET)
- `500` - Server error

**Schedule:** Daily at 02:00 (2 AM)

**Actions:**
1. Finds subscriptions expiring in 7 days
2. Sends warning emails to club owners
3. Finds expired subscriptions
4. Auto-downgrades to FREE plan (3 months)
5. Sends expiry notification emails
6. Updates subscription status

**Manual Testing:**
```bash
# GET endpoint for preview (requires admin auth)
curl https://your-domain.com/api/cron/check-subscriptions \
  -H "Cookie: your-admin-session-cookie"
```

---

## Database Functions

These functions are called via Supabase RPC, not HTTP endpoints.

### check_court_limit

**Function:** `check_court_limit(p_club_id UUID)`

**Returns:**
```typescript
{
  current_count: number;
  max_allowed: number;
  can_create: boolean;
}
```

**Usage:**
```typescript
const { data } = await supabase.rpc('check_court_limit', {
  p_club_id: 'uuid'
});
```

**Description:**
- Returns current court count for club
- Returns max allowed based on subscription plan
- Returns whether new courts can be created
- Defaults to FREE plan if no subscription

---

### check_booking_quota

**Function:** `check_booking_quota(p_club_id UUID)`

**Returns:**
```typescript
{
  current_count: number;
  max_allowed: number;
  overage_count: number;
  overage_fee: number;
  usage_percentage: number;
}
```

**Usage:**
```typescript
const { data } = await supabase.rpc('check_booking_quota', {
  p_club_id: 'uuid'
});
```

**Description:**
- Returns current booking count for current month
- Returns quota based on subscription plan
- Calculates overage count and fee
- Returns usage percentage (0-100+)

---

### increment_booking_count

**Function:** `increment_booking_count(p_club_id UUID)`

**Returns:** `void`

**Usage:**
```typescript
await supabase.rpc('increment_booking_count', {
  p_club_id: 'uuid'
});
```

**Description:**
- Increments monthly booking counter
- Creates record if doesn't exist
- Calculates overage automatically
- Updates overage fee

**Call After:** Successful booking creation

---

### decrement_booking_count

**Function:** `decrement_booking_count(p_club_id UUID)`

**Returns:** `void`

**Usage:**
```typescript
await supabase.rpc('decrement_booking_count', {
  p_club_id: 'uuid'
});
```

**Description:**
- Decrements monthly booking counter
- Recalculates overage
- Updates overage fee

**Call After:** Booking cancellation

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

**Common Error Codes:**

- `400 Bad Request` - Invalid request body or parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate name)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended for Production:**
- Admin endpoints: 100 requests/minute per IP
- Cron endpoints: 1 request/minute per endpoint
- Public endpoints: 60 requests/minute per IP

**Implementation:** Use Vercel Edge Config or Redis

---

## Webhooks

**Current:** No webhooks implemented

**Future Enhancements:**
- Subscription created/updated/cancelled
- Overage threshold reached
- Payment processed
- Plan changed

---

## SDK / Client Libraries

**Current:** Direct API calls via fetch/axios

**Example Usage:**
```typescript
// Create subscription plan
const response = await fetch('/api/admin/subscription-plans', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'PREMIUM',
    display_name: 'Gói Cao cấp',
    max_courts: 50,
    max_bookings_per_month: 5000,
    monthly_price: 800000,
    yearly_price: 8000000,
    overage_fee_per_booking: 1000,
  }),
});

const { plan } = await response.json();
```

---

## Changelog

### Version 1.0.0 (2025-01-31)
- Initial release
- Subscription plan CRUD
- Club subscription management
- Overage reporting
- Cron jobs for automation
- Database functions for limits

---

## Support

For API issues or questions:
- Check [Admin User Guide](admin-subscription-guide.md)
- Review [Setup Guide](subscription-management-setup.md)
- Contact system administrator

---

**Last Updated:** 2025-01-31
