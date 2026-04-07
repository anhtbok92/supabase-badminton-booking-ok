import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractSubdomain, isReservedSubdomain, serializeTenantContext } from '@/lib/tenant';
import { createMiddlewareSupabaseClient } from '@/supabase/middleware';

const BASE_DOMAIN = 'sportbooking.online';
const LOCALHOST_BASE = 'localhost:3000';

const PUBLIC_ROUTES = [
  '/', '/privacy', '/terms', '/splash',
  '/register-club', '/register-owner',
  '/bai-viet', '/robots.txt', '/sitemap.xml',
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(path) || path.startsWith('/bai-viet/');
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const path = request.nextUrl.pathname;

  // Determine which base domain to use (localhost vs production)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const baseDomain = isLocalhost ? LOCALHOST_BASE : BASE_DOMAIN;

  // Extract subdomain from hostname
  const subdomain = extractSubdomain(hostname, baseDomain);

  // --- No subdomain or reserved subdomain: use existing routing logic ---
  if (!subdomain || isReservedSubdomain(subdomain)) {
    return handleExistingRouting(request, hostname, path, isLocalhost);
  }

  // --- Club subdomain detected: resolve tenant ---
  const supabase = createMiddlewareSupabaseClient();
  const { data: club, error } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('custom_subdomain', subdomain)
    .eq('is_active', true)
    .single();

  if (error || !club) {
    // Unknown subdomain → redirect to app.sportbooking.online
    return NextResponse.redirect(
      isLocalhost
        ? new URL('/', `http://${LOCALHOST_BASE}`)
        : new URL('/', `https://app.${BASE_DOMAIN}`)
    );
  }

  // Set tenant context header and rewrite to same path
  const tenantContext = serializeTenantContext({
    clubId: club.id,
    clubName: club.name,
    subdomain,
  });

  const url = request.nextUrl.clone();
  // Rewrite root to splash for tenant subdomains (same as app.sportbooking.online)
  if (url.pathname === '/') {
    url.pathname = '/splash';
  }

  // Set tenant context as a request header so server components can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-context', tenantContext);

  const response = NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
  return response;
}

/**
 * Original routing logic for requests without a club subdomain.
 */
function handleExistingRouting(
  request: NextRequest,
  hostname: string,
  path: string,
  isLocalhost: boolean,
): NextResponse {
  // Localhost: allow all routes in dev
  if (isLocalhost) {
    return NextResponse.next();
  }

  // Vercel preview domain
  if (hostname === 'sportbookingonline.vercel.app') {
    return NextResponse.next();
  }

  // Production main domain: sportbooking.online / www
  if (hostname === 'sportbooking.online' || hostname === 'www.sportbooking.online') {
    if (isPublicRoute(path)) {
      return NextResponse.next();
    }
    if (!path.startsWith('/_next') && !path.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // app.sportbooking.online
  if (hostname === 'app.sportbooking.online') {
    if (path === '/') {
      return NextResponse.redirect(new URL('/splash', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.jfif$).*)',
  ],
};
