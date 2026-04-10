import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { generateSeoPages } from '@/lib/seo-generator';

/**
 * POST /api/seo/generate-pages
 * Auto-generates SEO landing pages based on actual club data.
 * Can be called from admin UI or cron job.
 * Requires CRON_SECRET or admin auth.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check: either cron secret or admin user
  const cronSecret = request.headers.get('x-cron-secret');
  const envSecret = process.env.CRON_SECRET;

  if (cronSecret && envSecret && cronSecret === envSecret) {
    // Cron auth OK
  } else {
    // Check admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const result = await generateSeoPages(supabase);

  return NextResponse.json({
    success: true,
    generated: result.generated,
    removed: result.removed,
    errors: result.errors,
  });
}
