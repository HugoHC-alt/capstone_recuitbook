export type CounselorReviewStatus =
  | 'requested'
  | 'completed'
  | 'declined'
  | 'withdrawn';

export const COUNSELOR_REVIEW_STATUS_LABELS: Record<CounselorReviewStatus, string> = {
  requested: 'Requested',
  completed: 'Completed',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

export interface CounselorReviewRequest {
  id: string;
  counselor_student_link_id: string;
  student_application_user_id: string;
  counselor_application_user_id: string;
  student_message: string | null;
  status: CounselorReviewStatus;
  requested_at: string;
  responded_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CounselorFeedbackNote {
  id: string;
  counselor_review_request_id: string;
  counselor_application_user_id: string;
  feedback_text: string;
  created_at: string;
}

export interface StudentReviewRequestSummary {
  id: string;
  linkId: string;
  status: CounselorReviewStatus;
  statusLabel: string;
  requestedAt: string;
  respondedAt: string | null;
  withdrawnAt: string | null;
  canWithdraw: boolean;
  feedbackText: string | null;
}

export interface CounselorReviewQueueSummary {
  requestId: string;
  counselorStudentLinkId: string;
  studentApplicationUserId: string;
  studentProfileId: string | null;
  preferredName: string | null;
  country: string | null;
  studentMessage: string | null;
  requestedAt: string;
}

export interface CounselorReviewActionResult {
  error: string | null;
  success: string | null;
}

export const INITIAL_COUNSELOR_REVIEW_ACTION_RESULT: CounselorReviewActionResult = {
  error: null,
  success: null,
};
