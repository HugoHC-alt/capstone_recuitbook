'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isPublicRegistrationRole } from '@/lib/auth/route-policies';
import type { AccountStatus } from '@/lib/auth/types';

export interface SignUpState {
  error: string | null;
}

const INITIAL_ACCOUNT_STATUS: AccountStatus = 'email_unverified';

const UNIQUE_VIOLATION = '23505';

const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? '').trim();

  if (!fullName) {
    return { error: 'Please enter your full name.' };
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (!isPublicRegistrationRole(role)) {
    return { error: 'Please choose a valid account type.' };
  }

  const supabase = await createSupabaseServerClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (signUpError) {
    const errFields = signUpError as unknown as {
      name?: unknown;
      message?: unknown;
      status?: unknown;
      code?: unknown;
      cause?: unknown;
      stack?: unknown;
    };

    let supabaseHost: string | null = null;
    try {
      supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
    } catch {
      supabaseHost = null;
    }

    console.error('[signUpAction] Supabase auth signUp failed', {
      error: {
        name: errFields.name,
        message: errFields.message,
        status: errFields.status,
        code: errFields.code,
        cause: errFields.cause,
        stack: errFields.stack,
        stringified: String(signUpError),
      },
      context: {
        role,
        emailPresent: email.length > 0,
        passwordPresent: password.length > 0,
        passwordLength: password.length, // length only — NEVER the password
        fullNamePresent: fullName.length > 0,
        supabaseHost, // hostname only — NEVER the key
      },
    });

    return { error: 'Could not create account. Please try again.' };
  }

  const authUserId = signUpData.user?.id;
  if (!authUserId) {
    return {
      error: 'Sign-up could not be completed. Please try again.',
    };
  }

  const adminClient = createSupabaseAdminClient();

  const { error: insertError } = await adminClient
    .from('application_users')
    .insert({
      auth_user_id: authUserId,
      email,
      full_name: fullName,
      role,
      account_status: INITIAL_ACCOUNT_STATUS,
    });

  if (insertError) {
    if (insertError.code !== UNIQUE_VIOLATION) {
      return {
        error:
          'Your account could not be fully created. Please try again or contact support if this persists.',
      };
    }
  }

  redirect('/login?registered=1');
}
