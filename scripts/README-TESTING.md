# Subscription Management Testing Guide

## Quick Start

### Running Automated Tests

**Windows:**
```bash
# Option 1: Double-click the batch file
scripts\test-subscription-lifecycle.bat

# Option 2: Run from command line
npm exec tsx scripts/test-subscription-lifecycle.ts
```

**Mac/Linux:**
```bash
npx tsx scripts/test-subscription-lifecycle.ts
```

## What Gets Tested

The automated test suite validates:

1. ✅ **Club Creation** - New clubs get FREE plan with 3-month trial
2. ✅ **Plan Upgrades** - Subscription upgrades work correctly
3. ✅ **Court Limits** - Court creation respects subscription limits
4. ✅ **Booking Quota** - Booking counters increment correctly
5. ✅ **Admin Workflows** - Plans, analytics, and reports work
6. ✅ **Database Functions** - All SQL functions working

## Test Output

The test script will output:
- ✅ Green checkmarks for passed tests
- ❌ Red X for failed tests
- ⏭️ Arrow for skipped tests
- Detailed information about each test
- Summary statistics at the end

Example output:
```
🚀 Starting Subscription Management Integration Tests
============================================================

📦 Test Suite 18.1: Complete Subscription Lifecycle
============================================================

📋 Test 1.1: Club Creation with Auto-Assigned FREE Plan
✅ 1.1: Club created with FREE plan successfully
   Details: {
  "club_id": "...",
  "plan": "FREE",
  "trial_end": "2026-06-28"
}

...

============================================================
📊 Test Results Summary
============================================================

✅ Passed: 9
❌ Failed: 0
⏭️  Skipped: 1
📝 Total: 10
```

## Test Data

The test script:
- Creates a test club named "Test Club Lifecycle"
- Creates test subscriptions and courts
- **Automatically cleans up** all test data after execution
- Does not affect production data

## Prerequisites

Before running tests, ensure:
1. ✅ Supabase database is running
2. ✅ All migrations have been applied
3. ✅ Environment variables are configured (`.env` file)
4. ✅ `NEXT_PUBLIC_SUPABASE_URL` is set
5. ✅ `SUPABASE_SERVICE_ROLE_KEY` is set

## Troubleshooting

### Error: Missing Supabase credentials
**Solution**: Check your `.env` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Error: Could not find column
**Solution**: Run database migrations:
```bash
# Check if migrations are applied
npm run verify-subscription-schema
```

### Error: PowerShell execution policy
**Solution**: Use the batch file or run with cmd:
```bash
cmd /c "npm exec tsx scripts/test-subscription-lifecycle.ts"
```

## Manual Testing

For features not covered by automated tests, see:
- `.kiro/specs/subscription-management/integration-tests.md` - Detailed manual test cases
- `.kiro/specs/subscription-management/integration-test-report.md` - Test results and verification

### Manual Test Checklist

- ⬜ Email notifications (subscription expiry, quota warnings)
- ⬜ Cron jobs (daily expiry check, monthly reports)
- ⬜ UI workflows (admin panel, club dashboard)
- ⬜ Overage calculation (requires exceeding quota)

## Test Documentation

- `scripts/test-subscription-lifecycle.ts` - Automated test script
- `scripts/test-subscription-lifecycle.bat` - Windows batch file
- `.kiro/specs/subscription-management/integration-tests.md` - Manual test cases
- `.kiro/specs/subscription-management/integration-test-report.md` - Test results
- `.kiro/specs/subscription-management/task-18-completion-summary.md` - Task summary

## Running Specific Tests

The test script runs all tests by default. To test specific functionality:

1. **Database Schema Only**:
   ```bash
   npm run verify-subscription-schema
   ```

2. **Full Integration Tests**:
   ```bash
   npm exec tsx scripts/test-subscription-lifecycle.ts
   ```

## CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  run: npm exec tsx scripts/test-subscription-lifecycle.ts
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## Support

For issues or questions:
1. Check the test output for detailed error messages
2. Review the integration test report
3. Verify database migrations are applied
4. Check environment variables are set correctly
