import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // 💎 NEXUS: Atualização de Sessão Supabase (Autenticação)
  const response = await updateSession(request);

  // 💎 NEXUS: Injeção de Pathname para o Rodapé (Footer Visibility)
  // Criamos uma nova resposta se o updateSession não retornar um redirecionamento
  const finalResponse = response || NextResponse.next();
  finalResponse.headers.set('x-pathname', request.nextUrl.pathname);

  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths exceto arquivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
