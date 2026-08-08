export const COUNSELOR_EMAIL_MAX_LENGTH = 255;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_REQUIRED = 'Please enter the counselor’s email address.';
const EMAIL_TOO_LONG = `Please keep the email under ${COUNSELOR_EMAIL_MAX_LENGTH} characters.`;
const EMAIL_INVALID = 'Please enter a valid email address.';

export function normalizeCounselorEmail(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export function validateCounselorEmail(
  value: unknown,
): { value: string } | { error: string } {
  const normalized = normalizeCounselorEmail(value);

  if (normalized.length === 0) {
    return { error: EMAIL_REQUIRED };
  }
  if (normalized.length > COUNSELOR_EMAIL_MAX_LENGTH) {
    return { error: EMAIL_TOO_LONG };
  }
  if (!EMAIL_SHAPE.test(normalized)) {
    return { error: EMAIL_INVALID };
  }

  return { value: normalized };
}
