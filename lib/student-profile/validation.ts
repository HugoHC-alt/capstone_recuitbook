export const STUDENT_PROFILE_MAX_LENGTHS = {
  preferred_name: 100,
  country: 100,
  city_region: 100,
  intended_major: 100,
  narrative: 2000,
  school_name: 200,
  title: 200,
  organization: 200,
  issuer: 200,
  child_country: 100,
  curriculum: 100,
  academic_summary: 1000,
  description: 1000,
} as const;

export const PROFILE_YEAR_MIN = 1900;
export const PROFILE_YEAR_MAX = 2100;

export function trimToNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
