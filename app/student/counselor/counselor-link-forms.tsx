'use client';

import { useActionState } from 'react';

import {
  INITIAL_COUNSELOR_LINK_ACTION_RESULT,
  type CounselorLinkActionResult,
} from '@/lib/counselor-link/types';
import {
  INITIAL_COUNSELOR_REVIEW_ACTION_RESULT,
  type CounselorReviewActionResult,
} from '@/lib/counselor-review/types';
import { ActionFeedback } from '@/components/ui/action-feedback';
import { PillButton } from '@/components/ui/pill-button';

type CounselorLinkAction = (
  prevState: CounselorLinkActionResult,
  formData: FormData,
) => Promise<CounselorLinkActionResult>;

type ReviewAction = (
  prevState: CounselorReviewActionResult,
  formData: FormData,
) => Promise<CounselorReviewActionResult>;

type ActionResultShape = { error: string | null; success: string | null };

function Feedback({ state }: { state: ActionResultShape }) {
  return <ActionFeedback error={state.error} success={state.success} />;
}

const labelClasses = 'block text-caption font-medium text-ash-gray mb-4';
const inputClasses =
  'w-full rounded-lg border border-fog-gray bg-pure-white px-12 py-8 text-body text-ink-black';
const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-fog-gray px-24 py-12 text-body font-medium text-ink-black transition-colors duration-150 hover:bg-fog-gray disabled:opacity-60';

export function RequestCounselorLinkForm({
  action,
}: {
  action: CounselorLinkAction;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_LINK_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      <Feedback state={state} />
      <div>
        <label htmlFor="counselor_email" className={labelClasses}>
          Counselor&apos;s email
        </label>
        <input
          id="counselor_email"
          name="counselor_email"
          type="email"
          maxLength={255}
          required
          className={inputClasses}
        />
      </div>
      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Requesting…' : 'Request connection'}
        </PillButton>
      </div>
    </form>
  );
}

export function RevokeCounselorLinkForm({
  action,
  linkId,
}: {
  action: CounselorLinkAction;
  linkId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_LINK_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {}
      <input type="hidden" name="link_id" value={linkId} />
      <Feedback state={state} />
      <div>
        <button type="submit" disabled={isPending} className={secondaryButtonClasses}>
          {isPending ? 'Revoking…' : 'Revoke'}
        </button>
      </div>
    </form>
  );
}

export function RequestReviewForm({
  action,
  linkId,
}: {
  action: ReviewAction;
  linkId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_REVIEW_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">
      {}
      <input type="hidden" name="link_id" value={linkId} />
      <Feedback state={state} />
      <div>
        <label htmlFor={`student_message_${linkId}`} className={labelClasses}>
          Message to your counselor (optional)
        </label>
        <textarea
          id={`student_message_${linkId}`}
          name="student_message"
          maxLength={1000}
          rows={3}
          className={inputClasses}
        />
      </div>
      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Requesting…' : 'Request review'}
        </PillButton>
      </div>
    </form>
  );
}

export function WithdrawReviewRequestForm({
  action,
  requestId,
}: {
  action: ReviewAction;
  requestId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_REVIEW_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {}
      <input type="hidden" name="request_id" value={requestId} />
      <Feedback state={state} />
      <div>
        <button type="submit" disabled={isPending} className={secondaryButtonClasses}>
          {isPending ? 'Withdrawing…' : 'Withdraw'}
        </button>
      </div>
    </form>
  );
}
