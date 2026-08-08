export type UserRole =
  | 'student'
  | 'counselor'
  | 'admissions_officer'
  | 'platform_admin';

export type AccountStatus =
  | 'email_unverified'
  | 'active'
  | 'pending_approval'
  | 'verified'
  | 'suspended';

export type ApprovalDecisionType = 'approved' | 'denied';

export type AuditAction =
  | 'user_registered'
  | 'email_verified'
  | 'login_succeeded'
  | 'login_failed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'counselor_approved'
  | 'admissions_officer_approved'
  | 'user_suspended'
  | 'unauthorized_access_denied';

export interface ApplicationUser {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  account_status: AccountStatus;
  last_login_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProtectedRoutePolicy {
  id: string;
  route_pattern: string;
  required_role: UserRole;
  required_status: AccountStatus;
  fallback_route: string;
  created_at: string;
}
