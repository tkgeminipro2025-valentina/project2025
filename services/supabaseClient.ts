import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Ưu tiên tên chuẩn Next.js; fallback các biến Supabase gợi ý và Vite
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_VITE_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||                           // tên "kinh điển"
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||                    // vài dự án dùng tên này
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||            // đúng như Studio đang gợi ý
  process.env.NEXT_PUBLIC_VITE_SUPABASE_ANON_KEY;                        // nếu lỡ dùng Vite trước đây

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createNotConfiguredError = () =>
  new Error('Missing Supabase envs: set NEXT_PUBLIC_SUPABASE_URL and a public key (ANON/PUBLISHABLE).');

const createMockSupabaseClient = (): SupabaseClient<any, any, any> =>
  ({ from: () => ({ select: () => Promise.reject(createNotConfiguredError()) }) } as any);

export const supabase: SupabaseClient<any, any, any> = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { autoRefreshToken: true, persistSession: true },
    })
  : createMockSupabaseClient();

export { isSupabaseConfigured };
