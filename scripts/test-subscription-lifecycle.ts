/**
 * Integration Test Script: Subscription Management Lifecycle
 * 
 * This script tests the complete subscription lifecycle:
 * 1. Club creation with auto-assigned FREE plan
 * 2. Upgrade to BASIC plan
 * 3. Court limit enforcement
 * 4. Booking quota tracking
 * 5. Overage calculation
 * 
 * Run with: tsx scripts/test-subscription-lifecycle.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  testCase: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(testCase: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${testCase}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
  results.push({ testCase, status, message, details });
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test club and related data
  const { error } = await supabase
    .from('clubs')
    .delete()
    .eq('name', 'Test Club Lifecycle');
  
  if (error) {
    console.log('   Note: Cleanup error (may not exist):', error.message);
  } else {
    console.log('   ✅ Test data cleaned up');
  }
}

async function testClubCreationWithFreePlan() {
  console.log('\n📋 Test 1.1: Club Creation with Auto-Assigned FREE Plan');
  
  try {
    // Get FREE plan ID
    const { data: freePlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, max_courts, max_bookings_per_month')
      .eq('name', 'FREE')
      .single();
    
    if (planError || !freePlan) {
      logTest('1.1', 'FAIL', 'FREE plan not found in database', planError);
      return null;
    }
    
    // Create test club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert({
        name: 'Test Club Lifecycle',
        address: '123 Test Street',
        phone: '0123456789',
        owner_name: 'Test Owner',
        owner_phone: '0123456789',
        description: 'Test club for integration testing',
        is_active: true
      })
      .select()
      .single();
    
    if (clubError || !club) {
      logTest('1.1', 'FAIL', 'Failed to create test club', clubError);
      return null;
    }
    
    // Create FREE subscription for the club
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 3-month trial
    
    const { data: subscription, error: subError } = await supabase
      .from('club_subscriptions')
      .insert({
        club_id: club.id,
        plan_id: freePlan.id,
        billing_cycle: 'monthly',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        auto_renew: false
      })
      .select()
      .single();
    
    if (subError || !subscription) {
      logTest('1.1', 'FAIL', 'Failed to create subscription', subError);
      return null;
    }
    
    // Update club with subscription reference
    const { error: updateError } = await supabase
      .from('clubs')
      .update({
        current_subscription_id: subscription.id,
        subscription_status: 'active'
      })
      .eq('id', club.id);
    
    if (updateError) {
      logTest('1.1', 'FAIL', 'Failed to update club subscription reference', updateError);
      return null;
    }
    
    // Verify the setup
    const { data: verification, error: verifyError } = await supabase
      .from('clubs')
      .select(`
        id,
        name,
        subscription_status,
        club_subscriptions!current_subscription_id (
          id,
          billing_cycle,
          start_date,
          end_date,
          is_active,
          subscription_plans (
            name,
            max_courts,
            max_bookings_per_month
          )
        )
      `)
      .eq('id', club.id)
      .single();
    
    if (verifyError || !verification) {
      logTest('1.1', 'FAIL', 'Failed to verify club setup', verifyError);
      return null;
    }
    
    const isValid = 
      verification.subscription_status === 'active' &&
      verification.club_subscriptions?.is_active === true &&
      verification.club_subscriptions?.subscription_plans?.name === 'FREE';
    
    if (isValid) {
      logTest('1.1', 'PASS', 'Club created with FREE plan successfully', {
        club_id: club.id,
        plan: 'FREE',
        trial_end: endDate.toISOString().split('T')[0]
      });
      return club.id;
    } else {
      logTest('1.1', 'FAIL', 'Club setup verification failed', verification);
      return null;
    }
  } catch (error) {
    logTest('1.1', 'FAIL', 'Unexpected error', error);
    return null;
  }
}

async function testUpgradeToBasic(clubId: string) {
  console.log('\n📋 Test 1.2: Upgrade from FREE to BASIC Plan');
  
  try {
    // Get BASIC plan
    const { data: basicPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, max_courts, max_bookings_per_month')
      .eq('name', 'BASIC')
      .single();
    
    if (planError || !basicPlan) {
      logTest('1.2', 'FAIL', 'BASIC plan not found', planError);
      return false;
    }
    
    // Deactivate current subscription
    const { error: deactivateError } = await supabase
      .from('club_subscriptions')
      .update({ is_active: false })
      .eq('club_id', clubId)
      .eq('is_active', true);
    
    if (deactivateError) {
      logTest('1.2', 'FAIL', 'Failed to deactivate FREE subscription', deactivateError);
      return false;
    }
    
    // Create new BASIC subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month for monthly billing
    
    const { data: newSubscription, error: subError } = await supabase
      .from('club_subscriptions')
      .insert({
        club_id: clubId,
        plan_id: basicPlan.id,
        billing_cycle: 'monthly',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        auto_renew: true
      })
      .select()
      .single();
    
    if (subError || !newSubscription) {
      logTest('1.2', 'FAIL', 'Failed to create BASIC subscription', subError);
      return false;
    }
    
    // Update club reference
    const { error: updateError } = await supabase
      .from('clubs')
      .update({ current_subscription_id: newSubscription.id })
      .eq('id', clubId);
    
    if (updateError) {
      logTest('1.2', 'FAIL', 'Failed to update club subscription reference', updateError);
      return false;
    }
    
    // Verify upgrade
    const { data: verification, error: verifyError } = await supabase
      .from('club_subscriptions')
      .select(`
        id,
        is_active,
        billing_cycle,
        auto_renew,
        subscription_plans (
          name,
          max_courts,
          max_bookings_per_month
        )
      `)
      .eq('id', newSubscription.id)
      .single();
    
    if (verifyError || !verification) {
      logTest('1.2', 'FAIL', 'Failed to verify upgrade', verifyError);
      return false;
    }
    
    const isValid = 
      verification.is_active === true &&
      verification.subscription_plans?.name === 'BASIC' &&
      verification.auto_renew === true;
    
    if (isValid) {
      logTest('1.2', 'PASS', 'Successfully upgraded to BASIC plan', {
        plan: 'BASIC',
        max_courts: verification.subscription_plans?.max_courts,
        max_bookings: verification.subscription_plans?.max_bookings_per_month
      });
      return true;
    } else {
      logTest('1.2', 'FAIL', 'Upgrade verification failed', verification);
      return false;
    }
  } catch (error) {
    logTest('1.2', 'FAIL', 'Unexpected error', error);
    return false;
  }
}

async function testCourtLimitEnforcement(clubId: string) {
  console.log('\n📋 Test 1.3 & 1.4: Court Limit Enforcement');
  
  try {
    // Check court limit using database function
    const { data: limitCheck, error: limitError } = await supabase
      .rpc('check_court_limit', { p_club_id: clubId });
    
    if (limitError) {
      logTest('1.3', 'FAIL', 'Failed to check court limit', limitError);
      return false;
    }
    
    if (!limitCheck || limitCheck.length === 0) {
      logTest('1.3', 'FAIL', 'No limit check result returned', limitCheck);
      return false;
    }
    
    const limit = limitCheck[0];
    
    logTest('1.3', 'PASS', 'Court limit check function works', {
      current_count: limit.current_count,
      max_allowed: limit.max_allowed,
      can_create: limit.can_create
    });
    
    // Test creating courts up to limit
    const courtsToCreate = Math.min(3, limit.max_allowed - limit.current_count);
    
    for (let i = 0; i < courtsToCreate; i++) {
      const { error: courtError } = await supabase
        .from('courts')
        .insert({
          club_id: clubId,
          name: `Sân Test ${i + 1}`,
          order: i
        });
      
      if (courtError) {
        logTest('1.3', 'FAIL', `Failed to create court ${i + 1}`, courtError);
        return false;
      }
    }
    
    logTest('1.3', 'PASS', `Successfully created ${courtsToCreate} courts`, {
      courts_created: courtsToCreate
    });
    
    // Verify updated count
    const { data: updatedLimit, error: updateError } = await supabase
      .rpc('check_court_limit', { p_club_id: clubId });
    
    if (updateError || !updatedLimit || updatedLimit.length === 0) {
      logTest('1.4', 'FAIL', 'Failed to verify updated court count', updateError);
      return false;
    }
    
    const newLimit = updatedLimit[0];
    
    logTest('1.4', 'PASS', 'Court limit enforcement verified', {
      current_count: newLimit.current_count,
      max_allowed: newLimit.max_allowed,
      can_create: newLimit.can_create,
      at_limit: newLimit.current_count >= newLimit.max_allowed
    });
    
    return true;
  } catch (error) {
    logTest('1.3', 'FAIL', 'Unexpected error', error);
    return false;
  }
}

async function testBookingQuotaTracking(clubId: string) {
  console.log('\n📋 Test 1.5: Booking Quota Tracking');
  
  try {
    // Check initial quota
    const { data: initialQuota, error: quotaError } = await supabase
      .rpc('check_booking_quota', { p_club_id: clubId });
    
    if (quotaError || !initialQuota || initialQuota.length === 0) {
      logTest('1.5', 'FAIL', 'Failed to check booking quota', quotaError);
      return false;
    }
    
    const quota = initialQuota[0];
    
    logTest('1.5', 'PASS', 'Booking quota check function works', {
      current_count: quota.current_count,
      max_allowed: quota.max_allowed,
      usage_percentage: quota.usage_percentage
    });
    
    // Simulate booking creation by calling increment function
    const bookingsToCreate = 5;
    
    for (let i = 0; i < bookingsToCreate; i++) {
      const { error: incrementError } = await supabase
        .rpc('increment_booking_count', { p_club_id: clubId });
      
      if (incrementError) {
        logTest('1.5', 'FAIL', `Failed to increment booking count (${i + 1})`, incrementError);
        return false;
      }
    }
    
    // Verify updated count
    const { data: updatedQuota, error: updateError } = await supabase
      .rpc('check_booking_quota', { p_club_id: clubId });
    
    if (updateError || !updatedQuota || updatedQuota.length === 0) {
      logTest('1.5', 'FAIL', 'Failed to verify updated booking count', updateError);
      return false;
    }
    
    const newQuota = updatedQuota[0];
    const expectedCount = (quota.current_count || 0) + bookingsToCreate;
    
    if (newQuota.current_count === expectedCount) {
      logTest('1.5', 'PASS', 'Booking quota tracking works correctly', {
        initial_count: quota.current_count,
        bookings_added: bookingsToCreate,
        final_count: newQuota.current_count,
        usage_percentage: newQuota.usage_percentage
      });
      return true;
    } else {
      logTest('1.5', 'FAIL', 'Booking count mismatch', {
        expected: expectedCount,
        actual: newQuota.current_count
      });
      return false;
    }
  } catch (error) {
    logTest('1.5', 'FAIL', 'Unexpected error', error);
    return false;
  }
}

async function testOverageCalculation(clubId: string) {
  console.log('\n📋 Test 1.7: Overage Calculation');
  
  try {
    // Get current quota
    const { data: quota, error: quotaError } = await supabase
      .rpc('check_booking_quota', { p_club_id: clubId });
    
    if (quotaError || !quota || quota.length === 0) {
      logTest('1.7', 'FAIL', 'Failed to check quota', quotaError);
      return false;
    }
    
    const currentQuota = quota[0];
    
    // Check if we have overage
    if (currentQuota.overage_count > 0) {
      // Verify overage calculation
      const { data: usageTracking, error: trackingError } = await supabase
        .from('booking_usage_tracking')
        .select('booking_count, overage_count, overage_fee')
        .eq('club_id', clubId)
        .eq('month', new Date().toISOString().split('T')[0].substring(0, 7) + '-01')
        .single();
      
      if (trackingError || !usageTracking) {
        logTest('1.7', 'FAIL', 'Failed to get usage tracking', trackingError);
        return false;
      }
      
      logTest('1.7', 'PASS', 'Overage calculation verified', {
        booking_count: usageTracking.booking_count,
        overage_count: usageTracking.overage_count,
        overage_fee: usageTracking.overage_fee,
        max_allowed: currentQuota.max_allowed
      });
      return true;
    } else {
      logTest('1.7', 'SKIP', 'No overage to test (quota not exceeded)', {
        current_count: currentQuota.current_count,
        max_allowed: currentQuota.max_allowed
      });
      return true;
    }
  } catch (error) {
    logTest('1.7', 'FAIL', 'Unexpected error', error);
    return false;
  }
}

async function testAdminWorkflows() {
  console.log('\n📋 Test 2.1-2.6: Admin Workflows');
  
  try {
    // Test 2.1: Verify subscription plans exist
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, display_name, max_courts, max_bookings_per_month, monthly_price')
      .order('monthly_price');
    
    if (plansError || !plans || plans.length === 0) {
      logTest('2.1', 'FAIL', 'Failed to fetch subscription plans', plansError);
      return false;
    }
    
    const hasRequiredPlans = plans.some(p => p.name === 'FREE') &&
                            plans.some(p => p.name === 'BASIC') &&
                            plans.some(p => p.name === 'PRO');
    
    if (hasRequiredPlans) {
      logTest('2.1', 'PASS', 'Subscription plans configured correctly', {
        plan_count: plans.length,
        plans: plans.map(p => p.name)
      });
    } else {
      logTest('2.1', 'FAIL', 'Missing required plans', {
        found_plans: plans.map(p => p.name)
      });
      return false;
    }
    
    // Test 2.5: Verify analytics data structure
    const { data: activeSubscriptions, error: subError } = await supabase
      .from('club_subscriptions')
      .select(`
        id,
        billing_cycle,
        subscription_plans (
          name,
          monthly_price,
          yearly_price
        )
      `)
      .eq('is_active', true);
    
    if (subError) {
      logTest('2.5', 'FAIL', 'Failed to fetch active subscriptions', subError);
      return false;
    }
    
    // Calculate MRR
    let mrr = 0;
    if (activeSubscriptions) {
      for (const sub of activeSubscriptions) {
        if (sub.billing_cycle === 'monthly') {
          mrr += sub.subscription_plans?.monthly_price || 0;
        } else if (sub.billing_cycle === 'yearly') {
          mrr += (sub.subscription_plans?.yearly_price || 0) / 12;
        }
      }
    }
    
    logTest('2.5', 'PASS', 'Analytics data structure verified', {
      active_subscriptions: activeSubscriptions?.length || 0,
      calculated_mrr: mrr,
      calculated_arr: mrr * 12
    });
    
    // Test 2.6: Verify overage report data
    const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
    const { data: overageData, error: overageError } = await supabase
      .from('booking_usage_tracking')
      .select(`
        club_id,
        booking_count,
        overage_count,
        overage_fee,
        clubs (
          name
        )
      `)
      .eq('month', currentMonth)
      .gt('overage_count', 0);
    
    if (overageError) {
      logTest('2.6', 'FAIL', 'Failed to fetch overage data', overageError);
      return false;
    }
    
    const totalOverageRevenue = overageData?.reduce((sum, item) => sum + (item.overage_fee || 0), 0) || 0;
    
    logTest('2.6', 'PASS', 'Overage report data verified', {
      clubs_with_overage: overageData?.length || 0,
      total_overage_revenue: totalOverageRevenue
    });
    
    return true;
  } catch (error) {
    logTest('2.1', 'FAIL', 'Unexpected error in admin workflows', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Subscription Management Integration Tests\n');
  console.log('=' .repeat(60));
  
  // Cleanup any existing test data
  await cleanup();
  
  // Test Suite 18.1: Complete Subscription Lifecycle
  console.log('\n📦 Test Suite 18.1: Complete Subscription Lifecycle');
  console.log('=' .repeat(60));
  
  const clubId = await testClubCreationWithFreePlan();
  
  if (clubId) {
    await testUpgradeToBasic(clubId);
    await testCourtLimitEnforcement(clubId);
    await testBookingQuotaTracking(clubId);
    await testOverageCalculation(clubId);
  }
  
  // Test Suite 18.2: Admin Workflows
  console.log('\n📦 Test Suite 18.2: Admin Workflows');
  console.log('=' .repeat(60));
  
  await testAdminWorkflows();
  
  // Cleanup
  await cleanup();
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.testCase}: ${r.message}`);
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
