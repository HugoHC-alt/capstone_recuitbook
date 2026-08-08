'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { PUBLIC_REGISTRATION_ROLES } from '@/lib/auth/route-policies';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';

import { signUpAction, type SignUpState } from './actions';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  counselor: 'Counselor',
  admissions_officer: 'Admissions officer',
};

const INITIAL_STATE: SignUpState = { error: null };

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    INITIAL_STATE,
  );

  const errorMessage =
    typeof state.error === 'string' && state.error.length > 0
      ? state.error
      : null;

  return (
    <main className="content-wrapper flex min-h-screen items-center justify-center py-40">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-heading-lg leading-heading-lg mb-8 text-center">
          Sign up
        </h1>
        <p className="text-body text-slate-gray mb-24 text-center">
          Create your RecruitBook account.
        </p>

        <Card>
          <div className="flex flex-col gap-16">
            <ActionFeedback error={errorMessage} />

            <form action={formAction} className="flex flex-col gap-16">
              <div>
                <label htmlFor="full_name" className={labelClasses}>
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className={inputClasses}
                />
              </div>

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
                  minLength={8}
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="role" className={labelClasses}>
                  Account type
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  defaultValue=""
                  className={inputClasses}
                >
                  <option value="" disabled>
                    Select an account type
                  </option>

                  {PUBLIC_REGISTRATION_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role] ?? role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <PillButton type="submit" disabled={isPending}>
                  {isPending ? 'Creating account…' : 'Sign up'}
                </PillButton>
              </div>
            </form>
          </div>
        </Card>

        <div className="mt-24 flex flex-col items-center gap-8 text-center">
          <p className="text-caption text-slate-gray">
            Note: <code>platform_admin</code> is not a public registration role.
          </p>
          <p className="text-body text-slate-gray">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
