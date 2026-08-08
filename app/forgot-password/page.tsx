import Link from 'next/link';

import { ActionFeedback } from '@/components/ui/action-feedback';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

import { requestPasswordResetAction } from './actions';

export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Record<string, string> = {
  sent: 'If an account exists for that email, a password reset link has been sent.',
};

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const noticeMessage =
    notice && Object.prototype.hasOwnProperty.call(NOTICE_MESSAGES, notice)
      ? NOTICE_MESSAGES[notice]
      : null;

  return (
    <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-8 text-center">
          Reset your password
        </h1>
        <p className="text-body text-slate-gray mb-24 text-center">
          Enter your account email and we&apos;ll send you a link to reset
          your password.
        </p>

        <Card>
          <div className="flex flex-col gap-16">
            <ActionFeedback success={noticeMessage} />

            <form
              action={requestPasswordResetAction}
              className="flex flex-col gap-16"
            >
              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <PillButton type="submit">Send reset link</PillButton>
              </div>
            </form>
          </div>
        </Card>

        <div className="mt-24 text-center">
          <p className="text-body text-slate-gray">
            Remembered it?{' '}
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
