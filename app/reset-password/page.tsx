import Link from 'next/link';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

import { updatePasswordAction } from './actions';

export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Record<string, string> = {
  invalid: 'Please enter and confirm your new password.',
  weak: 'Password must be at least 8 characters.',
  mismatch: 'The passwords did not match. Please try again.',
  'invalid-session':
    'Your reset link is invalid or has expired. Please request a new one.',
  error: 'Your password could not be updated. Please try again.',
};

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const noticeMessage =
    notice && Object.prototype.hasOwnProperty.call(NOTICE_MESSAGES, notice)
      ? NOTICE_MESSAGES[notice]
      : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
        <div className="w-full max-w-md">
          <h1 className="font-serif text-heading-lg leading-heading-lg mb-16 text-center">
            Set a new password
          </h1>
          <Card>
            <div className="flex flex-col gap-16">
              <ActionFeedback error="Your reset link is invalid or has expired." />
              <p className="text-body">
                <Link href="/forgot-password" className="underline">
                  Request a new reset link
                </Link>
                .
              </p>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-8 text-center">
          Set a new password
        </h1>
        <p className="text-body text-slate-gray mb-24 text-center">
          Choose a new password for your account.
        </p>

        <Card>
          <div className="flex flex-col gap-16">
            <ActionFeedback error={noticeMessage} />

            <form
              action={updatePasswordAction}
              className="flex flex-col gap-16"
            >
              <div>
                <label htmlFor="password" className={labelClasses}>
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={labelClasses}>
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <PillButton type="submit">Update password</PillButton>
              </div>
            </form>
          </div>
        </Card>

        <div className="mt-24 text-center">
          <p className="text-body">
            <Link href="/login" className="underline">
              Back to login
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
