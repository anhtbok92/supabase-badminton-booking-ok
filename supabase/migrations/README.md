# Database Migrations

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the content of the migration file
4. Paste and execute

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## Migration Files

### 001_initial_schema.sql
Creates the initial database schema with 7 tables:
- users
- clubs
- courts
- bookings
- news
- news_tags
- club_types

### 002_rls_policies.sql
Creates Row Level Security policies and helper functions.

### 003_subscription_management.sql
Creates subscription management system:
- subscription_plans table with default plans (FREE, BASIC, PRO)
- club_subscriptions table
- booking_usage_tracking table
- Adds subscription columns to clubs table
- Database functions:
  - check_court_limit()
  - check_booking_quota()
  - increment_booking_count()
  - decrement_booking_count()

## Applying Migration 003

To apply the subscription management migration:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire content of `003_subscription_management.sql`
4. Paste and click "Run"

The migration will:
- Create 3 new tables
- Add 2 columns to the clubs table
- Create 4 database functions
- Insert 3 default subscription plans (FREE, BASIC, PRO)
- Set up triggers for automatic timestamp updates
