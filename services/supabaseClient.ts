import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createNotConfiguredError = () =>
  new Error(
    'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );

const createRejectedPromise = <T>() => Promise.reject<T>(createNotConfiguredError());

const createMockQueryBuilder = (): any => {
  const builder: any = {
    order: () => createRejectedPromise(),
    single: () => createRejectedPromise(),
    eq: () => builder,
    select: () => builder,
    then: (...args: any[]) => createRejectedPromise().then(...args),
    catch: (...args: any[]) => createRejectedPromise().catch(...args),
    finally: (...args: any[]) => createRejectedPromise().finally(...args),
  };
  return builder;
};

const createMockTableApi = () => {
  const builder = createMockQueryBuilder();
  return {
    select: () => builder,
    insert: () => ({ select: () => builder }),
    update: () => ({ eq: () => ({ select: () => builder }) }),
    eq: () => builder,
  };
};

const createMockSupabaseClient = (): SupabaseClient<any, any, any> =>
  ({ from: () => createMockTableApi(), functions: { invoke: async () => ({ data: null, error: createNotConfiguredError() }) } } as any);

if (!isSupabaseConfigured) {
  // Đủ cảnh báo, đừng console.log key ra ngoài.
  console.warn('Supabase env not set. Using mock client.');
}

export const supabase: SupabaseClient<any, any, any> = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { autoRefreshToken: true, persistSession: true },
    })
  : createMockSupabaseClient();

export { isSupabaseConfigured };
