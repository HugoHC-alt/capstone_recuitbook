export const REVIEW_STUDENT_MESSAGE_MAX_LENGTH = 1000;
export const REVIEW_FEEDBACK_MAX_LENGTH = 4000;

const MESSAGE_TOO_LONG = `Please keep your message under ${REVIEW_STUDENT_MESSAGE_MAX_LENGTH} characters.`;
const FEEDBACK_REQUIRED = 'Please enter feedback before completing the review.';
const FEEDBACK_TOO_LONG = `Please keep your feedback under ${REVIEW_FEEDBACK_MAX_LENGTH} characters.`;

export function validateStudentMessage(
  value: unknown,
): { value: string | null } | { error: string } {
  if (typeof value !== 'string') {
    return { value: null };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { value: null };
  }
  if (trimmed.length > REVIEW_STUDENT_MESSAGE_MAX_LENGTH) {
    return { error: MESSAGE_TOO_LONG };
  }

  return { value: trimmed };
}

export function validateFeedbackText(
  value: unknown,
): { value: string } | { error: string } {
  if (typeof value !== 'string') {
    return { error: FEEDBACK_REQUIRED };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { error: FEEDBACK_REQUIRED };
  }
  if (trimmed.length > REVIEW_FEEDBACK_MAX_LENGTH) {
    return { error: FEEDBACK_TOO_LONG };
  }

  return { value: trimmed };
}
