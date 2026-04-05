import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const path = request.nextUrl.pathname;
  
  // Danh sách các route công khai (Landing Page, Privacy, Terms, Register, Blog)
  const isPublicRoute = 
    path === '/' || 
    path === '/privacy' || 
    path === '/terms' || 
    path === '/splash' || 
    path === '/register-club' || 
    path === '/register-owner' ||
    path === '/bai-viet' ||
    path.startsWith('/bai-viet/') ||
    path === '/robots.txt' ||
    path === '/sitemap.xml';

  // Localhost: Cho phép tất cả routes ở môi trường dev
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next();
  }
  
  // Vercel domain: Chỉ hiển thị landing page ở root
  // Không có subdomain nên app routes vẫn accessible trực tiếp
  if (hostname === 'sportbookingonline.vercel.app') {
    // Chỉ landing page ở root
    if (path === '/') {
      return NextResponse.next();
    }
    // Các routes khác (app) vẫn hoạt động bình thường
    return NextResponse.next();
  }
  
  // Production domain chính: sportbooking.online
  if (hostname === 'sportbooking.online' || hostname === 'www.sportbooking.online') {
    // Cho phép truy cập các trang công khai
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    // Redirect tất cả routes khác về landing page
    if (!path.startsWith('/_next') && !path.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Subdomain app (app.sportbooking.online)
  if (hostname === 'app.sportbooking.online') {
    // Nếu truy cập root, redirect về splash screen
    if (path === '/') {
      return NextResponse.redirect(new URL('/splash', request.url));
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
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.jfif$).*)',
  ],
};
