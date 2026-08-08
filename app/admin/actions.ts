'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getCurrentApplicationUser } from '@/lib/auth/get-current-application-user';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { UserRole, AccountStatus } from '@/lib/auth/types';

const ADMIN_DASHBOARD_ROUTE = '/admin/dashboard';

type NoticeCode =
  | 'approved'
  | 'suspended'
  | 'denied'
  | 'stale'
  | 'nochange'
  | 'error';

function backToDashboard(notice: NoticeCode): never {
  revalidatePath(ADMIN_DASHBOARD_ROUTE);
  redirect(`${ADMIN_DASHBOARD_ROUTE}?notice=${notice}`);
}

export async function approveUserAction(formData: FormData): Promise<void> {
  const caller = await getCurrentApplicationUser();
  if (
    !caller ||
    caller.role !== 'platform_admin' ||
    caller.account_status !== 'active'
  ) {
    backToDashboard('denied');
  }

  const targetId = formData.get('target_id');
  if (typeof targetId !== 'string' || targetId.length === 0) {
    backToDashboard('stale');
  }

  const supabase = await createSupabaseServerClient();

  const { data: target, error: loadError } = await supabase
    .from('application_users')
    .select('id, role, account_status')
    .eq('id', targetId)
    .single<{ id: string; role: UserRole; account_status: AccountStatus }>();

  if (loadError || !target) {
    backToDashboard('stale');
  }

  if (
    (target.role !== 'counselor' && target.role !== 'admissions_officer') ||
    target.account_status !== 'pending_approval'
  ) {
    backToDashboard('stale');
  }

  const { error: decisionError } = await supabase
    .from('approval_decisions')
    .insert({
      target_user_id: target.id,
      decided_by_admin_id: caller.id,
      target_role: target.role,
      decision: 'approved',
    });

  if (decisionError) {
    backToDashboard('error');
  }

  const { data: updated, error: updateError } = await supabase
    .from('application_users')
    .update({ account_status: 'verified' })
    .eq('id', target.id)
    .eq('account_status', 'pending_approval')
    .select('id');

  if (updateError) {
    backToDashboard('error');
  }

  if (!updated || updated.length === 0) {
    backToDashboard('stale');
  }

  const admin = createSupabaseAdminClient();
  const { error: auditError } = await admin.from('audit_log_entries').insert({
    actor_user_id: caller.id,
    target_user_id: target.id,
    action:
      target.role === 'counselor'
        ? 'counselor_approved'
        : 'admissions_officer_approved',
    outcome: 'success',
    metadata: {},
  });

  if (auditError) {
    backToDashboard('error');
  }

  backToDashboard('approved');
}

export async function suspendUserAction(formData: FormData): Promise<void> {
  const caller = await getCurrentApplicationUser();
  if (
    !caller ||
    caller.role !== 'platform_admin' ||
    caller.account_status !== 'active'
  ) {
    backToDashboard('denied');
  }

  const targetId = formData.get('target_id');
  if (typeof targetId !== 'string' || targetId.length === 0) {
    backToDashboard('nochange');
  }

  const rawReason = formData.get('reason');
  const reason =
    typeof rawReason === 'string' && rawReason.trim().length > 0
      ? rawReason.trim().slice(0, 200)
      : null;

  const supabase = await createSupabaseServerClient();

  const { data: updated, error: updateError } = await supabase
    .from('application_users')
    .update({
      account_status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspended_reason: reason,
    })
    .eq('id', targetId)
    .neq('account_status', 'suspended')
    .neq('role', 'platform_admin')
    .select('id')
    .returns<{ id: string }[]>();

  if (updateError) {
    backToDashboard('error');
  }

  if (!updated || updated.length === 0) {
    backToDashboard('nochange');
  }

  const admin = createSupabaseAdminClient();
  const { error: auditError } = await admin.from('audit_log_entries').insert({
    actor_user_id: caller.id,
    target_user_id: updated[0].id,
    action: 'user_suspended',
    outcome: 'success',
    metadata: reason ? { reason } : {},
  });

  if (auditError) {
    backToDashboard('error');
  }

  backToDashboard('suspended');
}
