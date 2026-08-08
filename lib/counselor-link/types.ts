export type CounselorLinkStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export const COUNSELOR_LINK_STATUS_LABELS: Record<CounselorLinkStatus, string> = {
  pending: 'Requested',
  accepted: 'Accepted',
  declined: 'Declined',
  revoked: 'Revoked',
};

export const REVOCABLE_STATUSES: readonly CounselorLinkStatus[] = ['pending', 'accepted'];

export interface CounselorStudentLink {
  id: string;
  student_application_user_id: string;
  counselor_email: string;
  counselor_application_user_id: string | null;
  status: CounselorLinkStatus;
  requested_at: string;
  responded_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentCounselorLinkSummary {
  id: string;
  counselorEmail: string;
  status: CounselorLinkStatus;
  statusLabel: string;
  requestedAt: string;
  respondedAt: string | null;
  revokedAt: string | null;
  canRevoke: boolean;
}

export interface CounselorPendingRequestSummary {
  id: string;
  studentApplicationUserId: string;
  requestedAt: string;
}

export interface CounselorLinkedStudentSummary {
  linkId: string;
  studentApplicationUserId: string;
  studentProfileId: string | null;
  preferredName: string | null;
  country: string | null;
  linkedAt: string | null;
}

export interface CounselorLinkActionResult {
  error: string | null;
  success: string | null;
}

export const INITIAL_COUNSELOR_LINK_ACTION_RESULT: CounselorLinkActionResult = {
  error: null,
  success: null,
};
