import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action =
  | 'list'
  | 'create_user'
  | 'update_role'
  | 'activate_user'
  | 'deactivate_user'
  | 'delete_user';

interface ManageUsersRequest {
  action?: Action;
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
  isAdmin?: boolean;
  targetUserId?: string;
}

const SUPABASE_URL = Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables (EDGE_SUPABASE_URL / EDGE_SUPABASE_SERVICE_ROLE_KEY) must be set.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ok = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

const error = (message: string, status = 400, details?: Record<string, unknown>) =>
  ok({ error: message, ...details }, status);

const ensureBearer = (authorization?: string | null) => {
  if (!authorization) return null;
  const parts = authorization.trim().split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return authorization;
};

const ROLE_VALUES = new Set(['super_admin', 'manager', 'staff', 'viewer']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accessToken = ensureBearer(req.headers.get('Authorization'));
    if (!accessToken) {
      return error('Missing access token', 401);
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return error('Invalid or expired token', 401);
    }

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load caller profile', profileError);
      return error('Could not verify caller profile', 500);
    }

    const isSuperAdmin = callerProfile?.role === 'super_admin';
    const callerIsAdmin = Boolean(callerProfile?.is_admin);

    if (!isSuperAdmin && !callerIsAdmin) {
      return error('Insufficient permissions', 403);
    }

    const requestBody: ManageUsersRequest = req.method === 'POST'
      ? await req.json().catch(() => ({}))
      : {};

    const action: Action = requestBody.action ?? 'list';

    if (action === 'list') {
      const [{ data: authList, error: listError }, { data: profiles, error: profilesError }] = await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
        supabaseAdmin.from('user_profiles').select('id, full_name, email, role, is_admin, created_at, updated_at'),
      ]);

      if (listError) {
        console.error('Failed to list auth users', listError);
        return error('Could not list users', 500);
      }
      if (profilesError) {
        console.error('Failed to list user_profiles', profilesError);
        return error('Could not list user profiles', 500);
      }

      const profileMap = new Map(profiles?.map((profile) => [profile.id, profile]));

      const users = (authList?.users ?? []).map((authUser) => {
        const profile = profileMap.get(authUser.id);
        return {
          id: authUser.id,
          email: authUser.email,
          fullName: profile?.full_name ?? authUser.user_metadata?.full_name ?? null,
          role: profile?.role ?? 'staff',
          isAdmin: Boolean(
            profile?.is_admin ??
            authUser.app_metadata?.is_admin ??
            authUser.user_metadata?.is_admin
          ),
          createdAt: profile?.created_at ?? authUser.created_at,
          updatedAt: profile?.updated_at ?? authUser.updated_at ?? profile?.updated_at,
          lastSignInAt: authUser.last_sign_in_at,
          bannedUntil: authUser.banned_until,
        };
      });

      return ok({ users });
    }

    if (action === 'create_user') {
      const email = requestBody.email?.trim().toLowerCase();
      const password = requestBody.password ?? '';
      const role = requestBody.role ?? 'staff';
      const fullName = requestBody.fullName?.trim();
      const isAdmin = Boolean(requestBody.isAdmin);

      if (!email || !password) {
        return error('Email and password are required to create a user.');
      }
      if (password.length < 6) {
        return error('Password must be at least 6 characters long.');
      }
      if (!ROLE_VALUES.has(role)) {
        return error('Invalid role specified.');
      }

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
        app_metadata: {
          is_admin: isAdmin,
        },
      });

      if (createError) {
        console.error('Failed to create user', createError);
        return error(createError.message ?? 'Could not create user', 400);
      }

      const newUser = createData.user;
      if (newUser) {
        await supabaseAdmin
          .from('user_profiles')
          .upsert({
            id: newUser.id,
            email: newUser.email ?? email,
            full_name: fullName ?? email,
            role,
            is_admin: isAdmin,
          });
      }

      return ok({ success: true, userId: newUser?.id ?? null }, 201);
    }

    const targetUserId = requestBody.targetUserId;
    if (!targetUserId) {
      return error('targetUserId is required for this action.');
    }

    if (targetUserId === user.id && ['delete_user', 'deactivate_user'].includes(action)) {
      return error('You cannot delete or deactivate your own account.', 400);
    }

    switch (action) {
      case 'update_role': {
        const role = requestBody.role ?? 'staff';
        const isAdmin = Boolean(requestBody.isAdmin);

        if (!ROLE_VALUES.has(role)) {
          return error('Invalid role specified.');
        }

        const { error: profileUpdateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ role, is_admin: isAdmin })
          .eq('id', targetUserId);

        if (profileUpdateError) {
          console.error('Failed to update user profile role', profileUpdateError);
          return error('Could not update user profile.', 500);
        }

        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          app_metadata: { is_admin: isAdmin },
        });

        if (authUpdateError) {
          console.error('Failed to update auth metadata', authUpdateError);
          return error('Could not update user auth metadata.', 500);
        }

        return ok({ success: true });
      }

      case 'deactivate_user': {
        const bannedUntil = '9999-12-31T23:59:59Z';

        const { error: deactivateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          banned_until: bannedUntil,
        });

        if (deactivateError) {
          console.error('Failed to deactivate user', deactivateError);
          return error('Could not deactivate user.', 500);
        }

        return ok({ success: true, bannedUntil });
      }

      case 'activate_user': {
        const { error: activateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          banned_until: null,
        });

        if (activateError) {
          console.error('Failed to activate user', activateError);
          return error('Could not activate user.', 500);
        }

        return ok({ success: true });
      }

      case 'delete_user': {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (deleteError) {
          console.error('Failed to delete user', deleteError);
          return error('Could not delete user.', 500);
        }

        await supabaseAdmin
          .from('user_profiles')
          .delete()
          .eq('id', targetUserId);

        return ok({ success: true });
      }

      default:
        return error('Unsupported action supplied.');
    }
  } catch (err) {
    console.error('Unhandled manage-users error', err);
    return error('Unexpected error occurred.', 500);
  }
});
