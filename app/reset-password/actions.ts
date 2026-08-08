'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LOGIN_ROUTE } from '@/lib/auth/route-policies';

const MIN_PASSWORD_LENGTH = 8;

export async function updatePasswordAction(formData: FormData): Promise<void> {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!password || !confirmPassword) {
    redirect('/reset-password?notice=invalid');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect('/reset-password?notice=weak');
  }
  if (password !== confirmPassword) {
    redirect('/reset-password?notice=mismatch');
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/reset-password?notice=invalid-session');
  }

  let updateFailed = false;
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      updateFailed = true;
    }
  } catch {
    updateFailed = true;
  }

  if (updateFailed) {
    redirect('/reset-password?notice=error');
  }

  redirect(`${LOGIN_ROUTE}?notice=password-updated`);
}
