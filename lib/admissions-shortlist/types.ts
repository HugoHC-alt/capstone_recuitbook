import type { AdmissionsVisibleStudentSummary } from '@/lib/admissions-discovery/types';

export interface AdmissionsShortlistEntry {
  id: string;
  admissions_officer_application_user_id: string;
  student_profile_id: string;
  created_at: string;
}

export interface AdmissionsShortlistActionResult {
  error: string | null;
  success: string | null;
}

export const INITIAL_ADMISSIONS_SHORTLIST_ACTION_RESULT: AdmissionsShortlistActionResult = {
  error: null,
  success: null,
};

export interface SavedAdmissionsStudentSummary extends AdmissionsVisibleStudentSummary {
  entryId: string;
}
