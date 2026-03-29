import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const path = request.nextUrl.pathname;
  
  // Localhost: Sử dụng query param để test
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const isAppMode = request.nextUrl.searchParams.get('app') === 'true';
    
    // Nếu không ở app mode và cố truy cập route khác (không phải landing)
    if (!isAppMode && path !== '/' && !path.startsWith('/_next') && !path.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Production: Phân biệt theo domain
  if (hostname === 'sportbooking.online' || hostname === 'www.sportbooking.online') {
    // Cho phép truy cập landing page
    if (path === '/') {
      return NextResponse.next();
    }
    
    // Redirect tất cả routes khác về landing page
    if (!path.startsWith('/_next') && !path.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Nếu truy cập từ subdomain app (app.sportbooking.online)
  if (hostname === 'app.sportbooking.online') {
    // Nếu truy cập root, redirect về trang admin
    if (path === '/') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
