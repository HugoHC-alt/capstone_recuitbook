import type {
  AccountStatus,
  ApplicationUser,
  ProtectedRoutePolicy,
  UserRole,
} from './types';

export const UNAUTHORIZED_ROUTE = '/unauthorized';

export const LOGIN_ROUTE = '/login';

export const PUBLIC_REGISTRATION_ROLES: readonly UserRole[] = [
  'student',
  'counselor',
  'admissions_officer',
];

export const PROTECTED_ROUTE_POLICIES: readonly Pick<
  ProtectedRoutePolicy,
  'route_pattern' | 'required_role' | 'required_status' | 'fallback_route'
>[] = [
  {
    route_pattern: '/student/dashboard',
    required_role: 'student',
    required_status: 'active',
    fallback_route: UNAUTHORIZED_ROUTE,
  },
  {
    route_pattern: '/counselor/pending',
    required_role: 'counselor',
    required_status: 'pending_approval',
    fallback_route: UNAUTHORIZED_ROUTE,
  },
  {
    route_pattern: '/counselor/dashboard',
    required_role: 'counselor',
    required_status: 'verified',
    fallback_route: UNAUTHORIZED_ROUTE,
  },
  {
    route_pattern: '/admissions/pending',
    required_role: 'admissions_officer',
    required_status: 'pending_approval',
    fallback_route: UNAUTHORIZED_ROUTE,
  },
  {
    route_pattern: '/admissions/dashboard',
    required_role: 'admissions_officer',
    required_status: 'verified',
    fallback_route: UNAUTHORIZED_ROUTE,
  },
  {
    route_pattern: '/admin/dashboard',
    required_role: 'platform_admin',
    required_status: 'active',
    fallback_route: UNAUTHORIZED_ROUTE,
  },
];

export function isPublicRegistrationRole(
  role: string | null | undefined,
): role is 'student' | 'counselor' | 'admissions_officer' {
  return PUBLIC_REGISTRATION_ROLES.includes(role as UserRole);
}

export function getDashboardRouteForUser(
  role: UserRole,
  accountStatus: AccountStatus,
): string {
  if (accountStatus === 'suspended') {
    return UNAUTHORIZED_ROUTE;
  }

  const policy = PROTECTED_ROUTE_POLICIES.find(
    (p) => p.required_role === role && p.required_status === accountStatus,
  );

  return policy ? policy.route_pattern : UNAUTHORIZED_ROUTE;
}

export function canAccessRoute(
  user: ApplicationUser | null | undefined,
  routePath: string,
): boolean {
  if (!user) {
    return false;
  }

  if (user.account_status === 'suspended') {
    return false;
  }

  const policy = PROTECTED_ROUTE_POLICIES.find(
    (p) => p.route_pattern === routePath,
  );

  if (!policy) {
    return false;
  }

  return (
    user.role === policy.required_role &&
    user.account_status === policy.required_status
  );
}
