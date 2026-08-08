import type {
  AdmissionsDiscoveryFilters,
  ProfileVisibilityInput,
} from '@/lib/admissions-discovery/types';
import { STUDENT_PROFILE_MAX_LENGTHS } from '@/lib/student-profile/validation';

const INVALID_VISIBILITY_INPUT =
  'Could not update your visibility settings. Please try again.';

export function validateProfileVisibilityInput(
  value: unknown,
): { value: ProfileVisibilityInput } | { error: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: INVALID_VISIBILITY_INPUT };
  }

  const record = value as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (key !== 'isPublished' && key !== 'admissionsConsent') {
      return { error: INVALID_VISIBILITY_INPUT };
    }
  }

  if (
    typeof record.isPublished !== 'boolean' ||
    typeof record.admissionsConsent !== 'boolean'
  ) {
    return { error: INVALID_VISIBILITY_INPUT };
  }

  return {
    value: {
      isPublished: record.isPublished,
      admissionsConsent: record.admissionsConsent,
    },
  };
}

function normalizeDiscoveryFilterValue(raw: unknown, maxLength: number): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (trimmed.length > maxLength) {
    return undefined;
  }

  return trimmed;
}

export function normalizeAdmissionsDiscoveryFilters(raw: {
  country?: unknown;
  major?: unknown;
}): AdmissionsDiscoveryFilters {
  const filters: AdmissionsDiscoveryFilters = {};

  const country = normalizeDiscoveryFilterValue(raw.country, STUDENT_PROFILE_MAX_LENGTHS.country);
  if (country !== undefined) {
    filters.country = country;
  }

  const major = normalizeDiscoveryFilterValue(raw.major, STUDENT_PROFILE_MAX_LENGTHS.intended_major);
  if (major !== undefined) {
    filters.major = major;
  }

  return filters;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
