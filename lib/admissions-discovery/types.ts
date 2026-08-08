export interface ProfileVisibilitySettings {
  id: string;
  student_profile_id: string;
  is_published: boolean;
  admissions_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileVisibilityInput {
  isPublished: boolean;
  admissionsConsent: boolean;
}

export interface ProfileVisibilityActionResult {
  error: string | null;
  success: string | null;
}

export const INITIAL_PROFILE_VISIBILITY_ACTION_RESULT: ProfileVisibilityActionResult = {
  error: null,
  success: null,
};

export interface AdmissionsVisibleStudentSummary {
  studentProfileId: string;
  preferredName: string | null;
  country: string | null;
  cityRegion: string | null;
  intendedMajor: string | null;
}

export interface AdmissionsDiscoveryFilters {
  country?: string;
  major?: string;
}
