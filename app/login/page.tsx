'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useActionState } from 'react';

import { ActionFeedback } from '@/components/ui/action-feedback';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

import { loginAction, type LoginState } from './actions';

const INITIAL_STATE: LoginState = { error: null };

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

function RegisteredNotice() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
  const passwordUpdated = searchParams.get('notice') === 'password-updated';

  if (justRegistered) {
    return (
      <ActionFeedback success="Account created. Please verify your email, then log in below." />
    );
  }

  if (passwordUpdated) {
    return (
      <ActionFeedback success="Your password has been updated. Please log in." />
    );
  }

  return null;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );

  return (
    <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-8 text-center">
          Login
        </h1>
        <p className="text-body text-slate-gray mb-24 text-center">
          Log in to your RecruitBook account.
        </p>

        <Card>
          <div className="flex flex-col gap-16">
            <Suspense fallback={null}>
              <RegisteredNotice />
            </Suspense>

            <ActionFeedback error={state.error} />

            <form action={formAction} className="flex flex-col gap-16">
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
                <label htmlFor="password" className={labelClasses}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <PillButton type="submit" disabled={isPending}>
                  {isPending ? 'Logging in…' : 'Log in'}
                </PillButton>
              </div>
            </form>
          </div>
        </Card>

        <div className="mt-24 flex flex-col items-center gap-8 text-center">
          <Link href="/forgot-password" className="text-body underline">
            Forgot password?
          </Link>
          <p className="text-body text-slate-gray">
            Need an account?{' '}
            <Link href="/sign-up" className="underline">
              Sign up
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
