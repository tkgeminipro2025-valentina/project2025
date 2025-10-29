import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, UserRole } from '../types';

interface ManageUsersResponse {
  users?: Array<UserProfile>;
  success?: boolean;
  userId?: string | null;
  error?: string;
  [key: string]: unknown;
}

const normalizeUser = (user: any): UserProfile => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName ?? null,
  role: user.role as UserRole,
  isAdmin: Boolean(user.isAdmin),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt ?? user.createdAt,
  lastSignInAt: user.lastSignInAt ?? null,
  bannedUntil: user.bannedUntil ?? null,
});

const invokeManageUsers = async (body: Record<string, unknown>): Promise<ManageUsersResponse> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.functions.invoke<ManageUsersResponse>('manage-users', {
    body,
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to call manage-users function.');
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return data ?? {};
};

export const listManagedUsers = async (): Promise<UserProfile[]> => {
  const response = await invokeManageUsers({ action: 'list' });
  return (response.users ?? []).map(normalizeUser);
};

export interface CreateManagedUserPayload {
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
  isAdmin: boolean;
}

export const createManagedUser = async (payload: CreateManagedUserPayload): Promise<void> => {
  await invokeManageUsers({
    action: 'create_user',
    ...payload,
  });
};

export const updateManagedUserRole = async (targetUserId: string, role: UserRole, isAdmin: boolean): Promise<void> => {
  await invokeManageUsers({
    action: 'update_role',
    targetUserId,
    role,
    isAdmin,
  });
};

export const deactivateManagedUser = async (targetUserId: string): Promise<void> => {
  await invokeManageUsers({
    action: 'deactivate_user',
    targetUserId,
  });
};

export const activateManagedUser = async (targetUserId: string): Promise<void> => {
  await invokeManageUsers({
    action: 'activate_user',
    targetUserId,
  });
};

export const deleteManagedUser = async (targetUserId: string): Promise<void> => {
  await invokeManageUsers({
    action: 'delete_user',
    targetUserId,
  });
};
