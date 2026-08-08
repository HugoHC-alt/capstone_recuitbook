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
  prev: CounselorReviewActionResult,
  fd: FormData,
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

function RespondForm({
  action,
  linkId,
  label,
  pendingLabel,
  primary,
}: {
  action: CounselorLinkAction;
  linkId: string;
  label: string;
  pendingLabel: string;
  primary: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_LINK_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">

      <input type="hidden" name="link_id" value={linkId} />
      <Feedback state={state} />
      {primary ? (
        <PillButton type="submit" disabled={isPending}>
          {isPending ? pendingLabel : label}
        </PillButton>
      ) : (
        <button type="submit" disabled={isPending} className={secondaryButtonClasses}>
          {isPending ? pendingLabel : label}
        </button>
      )}
    </form>
  );
}

export function PendingRequestActions({
  acceptAction,
  declineAction,
  linkId,
}: {
  acceptAction: CounselorLinkAction;
  declineAction: CounselorLinkAction;
  linkId: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <RespondForm
        action={acceptAction}
        linkId={linkId}
        label="Accept"
        pendingLabel="Accepting…"
        primary
      />
      <RespondForm
        action={declineAction}
        linkId={linkId}
        label="Decline"
        pendingLabel="Declining…"
        primary={false}
      />
    </div>
  );
}

export function DeclineReviewRequestForm({
  action,
  reviewRequestId,
}: {
  action: ReviewAction;
  reviewRequestId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_REVIEW_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">

      <input type="hidden" name="review_request_id" value={reviewRequestId} />
      <Feedback state={state} />
      <div>
        <button type="submit" disabled={isPending} className={secondaryButtonClasses}>
          {isPending ? 'Declining…' : 'Decline'}
        </button>
      </div>
    </form>
  );
}

export function SubmitFeedbackForm({
  action,
  reviewRequestId,
  studentProfileId,
}: {
  action: ReviewAction;
  reviewRequestId: string;
  studentProfileId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_COUNSELOR_REVIEW_ACTION_RESULT,
  );

  return (
    <form action={formAction} className="flex flex-col gap-16">

      <input type="hidden" name="review_request_id" value={reviewRequestId} />

      <input type="hidden" name="student_profile_id" value={studentProfileId} />
      <Feedback state={state} />
      <div>
        <label htmlFor={`feedback_text_${reviewRequestId}`} className={labelClasses}>
          Feedback for this student
        </label>
        <textarea
          id={`feedback_text_${reviewRequestId}`}
          name="feedback_text"
          maxLength={4000}
          rows={5}
          required
          className={inputClasses}
        />
      </div>
      <div>
        <PillButton type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : 'Submit feedback'}
        </PillButton>
      </div>
    </form>
  );
}
