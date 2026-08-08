'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import { redirectUserByRole } from '@/lib/auth/redirect-user-by-role';
import type { AccountStatus, ApplicationUser } from '@/lib/auth/types';

export interface LoginState {
  error: string | null;
}

const GENERIC_SIGN_IN_ERROR = 'Invalid email or password.';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailNotConfirmedError(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) {
    return false;
  }
  if (error.code === 'email_not_confirmed') {
    return true;
  }
  return (error.message ?? '')
    .toLowerCase()
    .includes('email not confirmed');
}

function verifiedTargetStatus(user: ApplicationUser): AccountStatus | null {
  switch (user.role) {
    case 'student':
      return 'active';
    case 'counselor':
    case 'admissions_officer':
      return 'pending_approval';
    default:
      return null;
  }
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !EMAIL_PATTERN.test(email) || !password) {
    return { error: GENERIC_SIGN_IN_ERROR };
  }

  const supabase = await createSupabaseServerClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    if (isEmailNotConfirmedError(signInError)) {
      return { error: 'Please verify your email, then log in.' };
    }
    return { error: GENERIC_SIGN_IN_ERROR };
  }

  const user = await getCurrentApplicationUser();

  if (!user) {
    await supabase.auth.signOut();
    return {
      error: 'Your account setup is incomplete. Please contact support.',
    };
  }

  let routedUser: ApplicationUser = user;

  if (user.account_status === 'email_unverified') {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const emailConfirmed = Boolean(authUser?.email_confirmed_at);

    if (emailConfirmed) {
      const target = verifiedTargetStatus(user);

      if (target) {
        const adminClient = createSupabaseAdminClient();

        const { error: updateError } = await adminClient
          .from('application_users')
          .update({ account_status: target })
          .eq('auth_user_id', user.auth_user_id)
          .eq('account_status', 'email_unverified');

        if (updateError) {
          return { error: 'Something went wrong. Please try again.' };
        }

        const refreshedUser = await getCurrentApplicationUser();

        if (!refreshedUser) {
          return { error: 'Something went wrong. Please try again.' };
        }

        routedUser = refreshedUser;
      }
    }
  }

  redirectUserByRole(routedUser);
}
