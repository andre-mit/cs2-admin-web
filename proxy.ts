import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const defaultLocale = 'en';
const locales = ['en', 'pt'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const shouldSkip = pathname.startsWith('/api') || 
                     pathname.startsWith('/_next') ||
                     pathname.includes('.') ||
                     pathname === '/favicon.ico' || 
                     pathname === '/icon.svg';
                     
  if (shouldSkip) return NextResponse.next();

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  const acceptLanguage = request.headers.get('accept-language');
  let locale = defaultLocale;
  
  if (acceptLanguage) {
    if (acceptLanguage.includes('pt')) {
      locale = 'pt';
    }
  }

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}
