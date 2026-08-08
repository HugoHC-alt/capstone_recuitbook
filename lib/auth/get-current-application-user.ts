import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ApplicationUser } from '@/lib/auth/types';

export async function getCurrentApplicationUser(): Promise<ApplicationUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('application_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single<ApplicationUser>();

  if (error || !data) {
    return null;
  }

  return data;
}
