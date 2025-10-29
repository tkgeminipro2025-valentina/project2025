import { DealStage, RolePermissions, UserRole } from './types';

export const DEAL_STAGES_ORDER: DealStage[] = [
  DealStage.New,
  DealStage.Quoting,
  DealStage.Won,
  DealStage.Lost,
];

export const DEFAULT_ROLE: UserRole = 'viewer';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    canManageRecords: true,
    canViewAnalytics: true,
    canDragDeals: true,
  },
  manager: {
    canManageRecords: true,
    canViewAnalytics: true,
    canDragDeals: true,
  },
  staff: {
    canManageRecords: true,
    canViewAnalytics: false,
    canDragDeals: true,
  },
  viewer: {
    canManageRecords: false,
    canViewAnalytics: false,
    canDragDeals: false,
  },
};

export const ASSIGNABLE_ROLES: UserRole[] = ['super_admin', 'manager', 'staff', 'viewer'];

export const ROOT_ADMIN_EMAIL = 'yvalentinaniehra@gmail.com';
