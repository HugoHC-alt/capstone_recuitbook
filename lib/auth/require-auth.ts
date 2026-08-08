import 'server-only';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LOGIN_ROUTE } from '@/lib/auth/route-policies';

export async function requireAuth(): Promise<User> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(LOGIN_ROUTE);
  }

  return user;
}
