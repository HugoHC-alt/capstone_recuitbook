'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SENT_NOTICE = '/forgot-password?notice=sent';

const RESET_CALLBACK_PATH = '/auth/callback?next=/reset-password';

async function resolveOrigin(): Promise<string | null> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const headerList = await headers();

  const origin = headerList.get('origin');
  if (origin) {
    return origin.replace(/\/+$/, '');
  }

  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  const host =
    headerList.get('x-forwarded-host') ?? headerList.get('host') ?? null;

  if (!host) {
    return null;
  }

  return `${proto}://${host}`;
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();

  if (email && EMAIL_PATTERN.test(email)) {
    const supabase = await createSupabaseServerClient();
    const origin = await resolveOrigin();

    if (origin) {
      const redirectTo = `${origin}${RESET_CALLBACK_PATH}`;

      await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    }
  }

  redirect(SENT_NOTICE);
}
