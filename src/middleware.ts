import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  // 💎 NEXUS: Injeção de Pathname para Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Aplicar a todas as rotas, exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
