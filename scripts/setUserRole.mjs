#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadEnv = () => {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (!key || !rest.length) continue;
    if (!process.env[key]) {
      process.env[key] = rest.join('=');
    }
  }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Update .env.local first.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.log('Usage: npm run set-role -- <user_id> --role <super_admin|manager|staff|viewer> [--admin true|false]');
  process.exit(0);
}

const userId = args[0];
let role = 'staff';
let setAdminFlag = null;

for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--role' && args[i + 1]) {
    role = args[i + 1];
    i++;
  } else if (arg === '--admin' && args[i + 1]) {
    setAdminFlag = args[i + 1] === 'true';
    i++;
  }
}

const validRoles = new Set(['super_admin', 'manager', 'staff', 'viewer']);
if (!validRoles.has(role)) {
  console.error(Invalid role "". Expected one of .);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const run = async () => {
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !user) {
    console.error('Failed to fetch user', userError?.message ?? 'Unknown error');
    process.exit(1);
  }

  if (setAdminFlag !== null) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { ...user.user?.user_metadata, is_admin: setAdminFlag },
    });
    if (updateError) {
      console.error('Failed to update user metadata', updateError.message);
      process.exit(1);
    }
    console.log(Updated is_admin= for user );
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email: user.user?.email ?? null,
      full_name: user.user?.user_metadata?.full_name ?? user.user?.email ?? null,
      role,
    });
  if (profileError) {
    console.error('Failed to upsert user profile', profileError.message);
    process.exit(1);
  }

  console.log(Role for  set to .);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
