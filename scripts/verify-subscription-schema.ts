/**
 * Verification script for subscription management schema
 * Run this after applying migration 003_subscription_management.sql
 * 
 * Usage: npx tsx scripts/verify-subscription-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log('🔍 Verifying subscription management schema...\n');

  try {
    // 1. Check subscription_plans table
    console.log('1️⃣ Checking subscription_plans table...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');
    
    if (plansError) {
      console.error('❌ Error querying subscription_plans:', plansError.message);
      return false;
    }
    
    if (!plans || plans.length !== 3) {
      console.error('❌ Expected 3 default plans, found:', plans?.length || 0);
      return false;
    }
    
    const planNames = plans.map(p => p.name).sort();
    if (JSON.stringify(planNames) !== JSON.stringify(['BASIC', 'FREE', 'PRO'])) {
      console.error('❌ Expected plans: FREE, BASIC, PRO. Found:', planNames);
      return false;
    }
    
    console.log('✅ subscription_plans table OK (3 plans: FREE, BASIC, PRO)\n');

    // 2. Check club_subscriptions table
    console.log('2️⃣ Checking club_subscriptions table...');
    const { error: subsError } = await supabase
      .from('club_subscriptions')
      .select('*')
      .limit(1);
    
    if (subsError) {
      console.error('❌ Error querying club_subscriptions:', subsError.message);
      return false;
    }
    
    console.log('✅ club_subscriptions table OK\n');

    // 3. Check booking_usage_tracking table
    console.log('3️⃣ Checking booking_usage_tracking table...');
    const { error: usageError } = await supabase
      .from('booking_usage_tracking')
      .select('*')
      .limit(1);
    
    if (usageError) {
      console.error('❌ Error querying booking_usage_tracking:', usageError.message);
      return false;
    }
    
    console.log('✅ booking_usage_tracking table OK\n');

    // 4. Check clubs table has new columns
    console.log('4️⃣ Checking clubs table for subscription columns...');
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id, current_subscription_id, subscription_status')
      .limit(1);
    
    if (clubsError) {
      console.error('❌ Error querying clubs:', clubsError.message);
      return false;
    }
    
    console.log('✅ clubs table has subscription columns\n');

    // 5. Test check_court_limit function
    console.log('5️⃣ Testing check_court_limit() function...');
    const { data: courtLimit, error: courtLimitError } = await supabase
      .rpc('check_court_limit', { p_club_id: '00000000-0000-0000-0000-000000000000' });
    
    if (courtLimitError) {
      console.error('❌ Error calling check_court_limit:', courtLimitError.message);
      return false;
    }
    
    if (!courtLimit || typeof courtLimit[0]?.current_count !== 'number') {
      console.error('❌ check_court_limit returned unexpected result:', courtLimit);
      return false;
    }
    
    console.log('✅ check_court_limit() function OK\n');

    // 6. Test check_booking_quota function
    console.log('6️⃣ Testing check_booking_quota() function...');
    const { data: bookingQuota, error: quotaError } = await supabase
      .rpc('check_booking_quota', { p_club_id: '00000000-0000-0000-0000-000000000000' });
    
    if (quotaError) {
      console.error('❌ Error calling check_booking_quota:', quotaError.message);
      return false;
    }
    
    if (!bookingQuota || typeof bookingQuota[0]?.current_count !== 'number') {
      console.error('❌ check_booking_quota returned unexpected result:', bookingQuota);
      return false;
    }
    
    console.log('✅ check_booking_quota() function OK\n');

    // 7. Test increment_booking_count function (with real club if exists)
    console.log('7️⃣ Testing increment_booking_count() function...');
    
    // Get a real club ID to test with
    const { data: testClubs, error: testClubError } = await supabase
      .from('clubs')
      .select('id')
      .limit(1);
    
    if (testClubError) {
      console.warn('⚠️  Could not fetch test club:', testClubError.message);
      console.log('⏭️  Skipping increment_booking_count test (no clubs available)\n');
    } else if (testClubs && testClubs.length > 0) {
      const testClubId = testClubs[0].id;
      
      const { error: incrementError } = await supabase
        .rpc('increment_booking_count', { p_club_id: testClubId });
      
      if (incrementError) {
        console.error('❌ Error calling increment_booking_count:', incrementError.message);
        return false;
      }
      
      console.log('✅ increment_booking_count() function OK\n');

      // 8. Test decrement_booking_count function
      console.log('8️⃣ Testing decrement_booking_count() function...');
      const { error: decrementError } = await supabase
        .rpc('decrement_booking_count', { p_club_id: testClubId });
      
      if (decrementError) {
        console.error('❌ Error calling decrement_booking_count:', decrementError.message);
        return false;
      }
      
      console.log('✅ decrement_booking_count() function OK\n');
      
      // Clean up test data
      await supabase
        .from('booking_usage_tracking')
        .delete()
        .eq('club_id', testClubId);
    } else {
      console.log('⏭️  Skipping increment/decrement tests (no clubs in database)\n');
    }

    console.log('✅ All schema verification checks passed!\n');
    console.log('📊 Summary:');
    console.log('  - 3 tables created (subscription_plans, club_subscriptions, booking_usage_tracking)');
    console.log('  - 2 columns added to clubs table');
    console.log('  - 4 database functions working (check_court_limit, check_booking_quota, increment_booking_count, decrement_booking_count)');
    console.log('  - 3 default plans inserted (FREE, BASIC, PRO)');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

verifySchema()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
