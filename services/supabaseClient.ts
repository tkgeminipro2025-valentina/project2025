import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ❶ Đọc env (không có default)
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// ❷ Validate chắc cú
const isValidUrl = !!rawUrl && /^https?:\/\/.+/i.test(rawUrl);
const isValidKey = !!rawKey && rawKey.length > 20; // (thường bắt đầu bằng 'eyJ', JWT dài)

const isSupabaseConfigured = isValidUrl && isValidKey;

function notConfiguredErr() {
  return new Error(
    'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel.'
  );
}

const mock = (() => {
  const reject = <T>() => Promise.reject<T>(notConfiguredErr());
  const qb: any = { order: reject, single: reject, eq: () => qb, select: () => qb, then: (...a:any[])=>reject().then(...a) };
  return { from: () => ({ select: () => qb }), auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }) } } as any;
})();

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(rawUrl!, rawKey!, { auth: { autoRefreshToken: true, persistSession: true } })
  : (console.warn('[Supabase] Env missing → using mock client'), mock);

export { isSupabaseConfigured };
