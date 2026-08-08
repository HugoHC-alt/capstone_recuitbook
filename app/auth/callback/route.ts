import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_NEXT_PATHS = new Set<string>(['/reset-password', '/login']);

const DEFAULT_NEXT = '/login';

function safeNextPath(next: string | null): string {
  if (next && ALLOWED_NEXT_PATHS.has(next)) {
    return next;
  }
  return DEFAULT_NEXT;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL('/login?notice=reset-invalid', url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
