import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminRole() {
  console.log('🔍 Checking admin users...\n');

  // Get all users with admin role
  const { data: adminUsers, error } = await supabase
    .from('users')
    .select('id, email, phone, role')
    .eq('role', 'admin');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!adminUsers || adminUsers.length === 0) {
    console.log('⚠️  No admin users found!');
    console.log('\nTo create an admin user:');
    console.log('1. Login to your app with a user account');
    console.log('2. Run this SQL in Supabase SQL Editor:');
    console.log('\n   UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';');
    return;
  }

  console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
  adminUsers.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}\n`);
  });
}

checkAdminRole();
