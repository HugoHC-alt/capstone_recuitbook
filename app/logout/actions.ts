'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LOGIN_ROUTE } from '@/lib/auth/route-policies';

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect(LOGIN_ROUTE);
}
