import type { UserRole } from '@/types';
import { ROLE_HIERARCHY } from './constants';

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin' || role === 'owner';
}

export function canManageAdmins(role: UserRole): boolean {
  return isSuperAdmin(role);
}

export function canManageOrganization(role: UserRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canManageProjects(role: UserRole): boolean {
  return hasMinimumRole(role, 'project_manager');
}

export function canDeleteContent(role: UserRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canViewAdminStudio(role: UserRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canInviteUsers(role: UserRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canCreateTasks(role: UserRole): boolean {
  return hasMinimumRole(role, 'member');
}

export function canEditTask(userId: string, taskCreatorId: string, taskAssigneeIds: string[], userRole: UserRole): boolean {
  if (hasMinimumRole(userRole, 'admin')) return true;
  if (userId === taskCreatorId) return true;
  if (taskAssigneeIds.includes(userId)) return true;
  return false;
}

export function canDeleteTask(userId: string, taskCreatorId: string, userRole: UserRole): boolean {
  if (hasMinimumRole(userRole, 'admin')) return true;
  if (userId === taskCreatorId) return true;
  return false;
}

export function canManageIntegrations(role: UserRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canAccessWhatsAppBot(role: UserRole): boolean {
  return hasMinimumRole(role, 'member');
}
