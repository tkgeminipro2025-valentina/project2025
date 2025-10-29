import React, { useMemo, useState } from 'react';
import { ASSIGNABLE_ROLES, ROOT_ADMIN_EMAIL } from '../constants';
import { CreateManagedUserPayload } from '../services/userAdminService';
import { UserProfile, UserRole } from '../types';

interface UserManagementProps {
    users: UserProfile[];
    loading: boolean;
    actionId: string | null;
    error?: string | null;
    notice?: string | null;
    onRefresh: () => void | Promise<void>;
    onCreate: (payload: CreateManagedUserPayload) => Promise<boolean>;
    onUpdateRole: (userId: string, role: UserRole, isAdmin: boolean) => Promise<boolean>;
    onActivate: (userId: string) => Promise<boolean>;
    onDeactivate: (userId: string) => Promise<boolean>;
    onDelete: (userId: string) => Promise<boolean>;
    currentUserId?: string | null;
}

const initialFormState: CreateManagedUserPayload & { password: string } = {
    email: '',
    password: '',
    fullName: '',
    role: 'staff',
    isAdmin: false,
};

const formatRoleLabel = (role: UserRole) => role.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const formatDate = (iso?: string | null) => {
    if (!iso) {
        return '—';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleString('vi-VN', { hour12: false });
};

const UserManagement: React.FC<UserManagementProps> = ({
    users,
    loading,
    actionId,
    error,
    notice,
    onRefresh,
    onCreate,
    onUpdateRole,
    onActivate,
    onDeactivate,
    onDelete,
    currentUserId,
}) => {
    const [formState, setFormState] = useState(initialFormState);
    const [formError, setFormError] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<string, { role: UserRole; isAdmin: boolean }>>({});

    const creationLoading = actionId === 'create';

    const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedEmail = formState.email.trim().toLowerCase();
        const trimmedName = formState.fullName?.trim();

        if (!trimmedEmail) {
            setFormError('Vui long nhap email hop le.');
            return;
        }
        if (formState.password.length < 6) {
            setFormError('Mat khau phai co it nhat 6 ky tu.');
            return;
        }

        setFormError(null);
        const success = await onCreate({
            email: trimmedEmail,
            password: formState.password,
            fullName: trimmedName,
            role: formState.role,
            isAdmin: formState.isAdmin,
        });

        if (success) {
            setFormState(initialFormState);
        }
    };

    const getPendingValues = (user: UserProfile) => {
        return pendingChanges[user.id] ?? { role: user.role, isAdmin: user.isAdmin };
    };

    const hasPendingChange = (user: UserProfile) => {
        const pending = getPendingValues(user);
        return pending.role !== user.role || pending.isAdmin !== user.isAdmin;
    };

    const handleRoleChange = (user: UserProfile, nextRole: UserRole) => {
        setPendingChanges((prev) => ({
            ...prev,
            [user.id]: {
                role: nextRole,
                isAdmin: getPendingValues(user).isAdmin,
            },
        }));
    };

    const handleAdminToggle = (user: UserProfile, isAdmin: boolean) => {
        setPendingChanges((prev) => ({
            ...prev,
            [user.id]: {
                role: getPendingValues(user).role,
                isAdmin,
            },
        }));
    };

    const applyRoleUpdate = async (user: UserProfile) => {
        const pending = getPendingValues(user);
        const success = await onUpdateRole(user.id, pending.role, pending.isAdmin);
        if (success) {
            setPendingChanges((prev) => {
                const next = { ...prev };
                delete next[user.id];
                return next;
            });
        }
    };

    const tableRows = useMemo(() => users, [users]);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Quan ly nguoi dung</h2>
                    <p className="text-sm text-text-secondary">Tao tai khoan moi, gan vai tro, khoa hoac xoa nguoi dung.</p>
                </div>
                <button
                    type="button"
                    onClick={() => onRefresh()}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
                >
                    Lam moi
                </button>
            </div>

            {(error || formError) && (
                <div className="px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
                    {formError ?? error}
                </div>
            )}

            {notice && !error && (
                <div className="px-4 py-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm">
                    {notice}
                </div>
            )}

            <form onSubmit={handleCreateUser} className="grid gap-4 rounded-lg border border-border bg-surface p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col text-sm font-semibold">
                        Email
                        <input
                            type="email"
                            value={formState.email}
                            onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="user@example.com"
                            required
                            disabled={creationLoading}
                        />
                    </label>
                    <label className="flex flex-col text-sm font-semibold">
                        Ho ten
                        <input
                            type="text"
                            value={formState.fullName ?? ''}
                            onChange={(e) => setFormState((prev) => ({ ...prev, fullName: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Tran Van A"
                            required
                            disabled={creationLoading}
                        />
                    </label>
                    <label className="flex flex-col text-sm font-semibold">
                        Mat khau tam
                        <input
                            type="password"
                            value={formState.password}
                            onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                            className="mt-1 rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Toi thieu 6 ky tu"
                            required
                            disabled={creationLoading}
                        />
                    </label>
                    <label className="flex flex-col text-sm font-semibold">
                        Vai tro
                        <select
                            value={formState.role}
                            onChange={(e) => setFormState((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                            className="mt-1 rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            disabled={creationLoading}
                        >
                            {ASSIGNABLE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {formatRoleLabel(role)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <label className="inline-flex items-center space-x-2 text-sm font-semibold">
                    <input
                        type="checkbox"
                        checked={formState.isAdmin}
                        onChange={(e) => setFormState((prev) => ({ ...prev, isAdmin: e.target.checked }))}
                        className="rounded border-border text-primary focus:ring-primary/60"
                        disabled={creationLoading}
                    />
                    <span>Cap quyen admin (truy cap analytics va RLS dac biet)</span>
                </label>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={creationLoading}
                        className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover disabled:bg-primary/40 disabled:cursor-not-allowed"
                    >
                        {creationLoading ? 'Dang tao...' : 'Tao tai khoan moi'}
                    </button>
                </div>
            </form>

            <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="text-sm text-text-secondary">
                        Tong so nguoi dung: {users.length}
                    </div>
                    {loading && <div className="text-sm text-text-secondary">Dang tai danh sach...</div>}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-background-alt">
                            <tr className="text-left text-xs uppercase text-text-secondary">
                                <th className="px-4 py-3 font-semibold">Nguoi dung</th>
                                <th className="px-4 py-3 font-semibold">Vai tro</th>
                                <th className="px-4 py-3 font-semibold">Admin</th>
                                <th className="px-4 py-3 font-semibold">Trang thai</th>
                                <th className="px-4 py-3 font-semibold">Lan dang nhap cuoi</th>
                                <th className="px-4 py-3 font-semibold">Hanh dong</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {tableRows.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-center text-text-secondary" colSpan={6}>
                                        Chua co nguoi dung nao.
                                    </td>
                                </tr>
                            ) : (
                                tableRows.map((user) => {
                                    const pending = getPendingValues(user);
                                    const hasChanges = hasPendingChange(user);
                                    const updateLoading = actionId === `role:${user.id}`;
                                    const deactivateLoading = actionId === `deactivate:${user.id}`;
                                    const activateLoading = actionId === `activate:${user.id}`;
                                    const deleteLoading = actionId === `delete:${user.id}`;
                                    const isCurrentUser = currentUserId === user.id;
                                    const isRootAdmin = user.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
                                    const isSuspended = Boolean(user.bannedUntil);

                                    return (
                                        <tr key={user.id} className={isRootAdmin ? 'bg-primary/5' : undefined}>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold">{user.fullName ?? user.email}</div>
                                                <div className="text-xs text-text-secondary">{user.email}</div>
                                                {isRootAdmin && (
                                                    <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                                        Root admin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={pending.role}
                                                    onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                                                    className="w-36 rounded-md border border-border bg-background-alt px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60 text-sm"
                                                    disabled={updateLoading || isRootAdmin}
                                                >
                                                    {ASSIGNABLE_ROLES.map((role) => (
                                                        <option key={role} value={role}>
                                                            {formatRoleLabel(role)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <label className="inline-flex items-center space-x-2 text-xs font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={pending.isAdmin}
                                                        onChange={(e) => handleAdminToggle(user, e.target.checked)}
                                                        className="rounded border-border text-primary focus:ring-primary/60"
                                                        disabled={updateLoading || isRootAdmin}
                                                    />
                                                    <span>Admin</span>
                                                </label>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    isSuspended ? 'bg-red-500/15 text-red-200' : 'bg-emerald-500/15 text-emerald-200'
                                                }`}>
                                                    {isSuspended ? 'Bi khoa' : 'Hoat dong'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(user.lastSignInAt)}</td>
                                            <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => applyRoleUpdate(user)}
                                                    disabled={!hasChanges || updateLoading || isRootAdmin}
                                                    className="px-3 py-1 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {updateLoading ? 'Dang cap nhat...' : 'Luu thay doi'}
                                                </button>
                                                {isSuspended ? (
                                                    <button
                                                        type="button"
                                                        onClick={async () => { await onActivate(user.id); }}
                                                        disabled={activateLoading}
                                                        className="px-3 py-1 rounded-lg border border-emerald-500/60 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {activateLoading ? 'Dang mo khoa...' : 'Mo khoa'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={async () => { await onDeactivate(user.id); }}
                                                        disabled={deactivateLoading || isCurrentUser || isRootAdmin}
                                                        className="px-3 py-1 rounded-lg border border-amber-500/60 text-xs font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {deactivateLoading ? 'Dang khoa...' : 'Khoa'}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (isCurrentUser || isRootAdmin) {
                                                            return;
                                                        }
                                                        if (confirm('Ban chac chan muon xoa tai khoan nay?')) {
                                                            await onDelete(user.id);
                                                        }
                                                    }}
                                                    disabled={deleteLoading || isCurrentUser || isRootAdmin}
                                                    className="px-3 py-1 rounded-lg border border-red-500/60 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {deleteLoading ? 'Dang xoa...' : 'Xoa'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;








