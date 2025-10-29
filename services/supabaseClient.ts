import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const processEnv = typeof process !== 'undefined' ? process.env : undefined;

const supabaseUrl = "your_supabase_url";

const supabaseAnonKey = "your_supabase_anon_key";

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createNotConfiguredError = () =>
    new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

const createRejectedPromise = <T>() =>
    Promise.reject<T>(createNotConfiguredError());

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
        insert: () => ({
            select: () => builder,
        }),
        update: () => ({
            eq: () => ({
                select: () => builder,
            }),
        }),
        eq: () => builder,
    };
};

const createMockSupabaseClient = (): SupabaseClient<any, any, any> => {
    const mock = {
        from: () => createMockTableApi(),
        functions: {
            invoke: async () => ({ data: null, error: createNotConfiguredError() }),
        },
    };

    return mock as unknown as SupabaseClient<any, any, any>;
};

if (!isSupabaseConfigured) {
    console.warn('Supabase environment variables are not set. Falling back to mock client.');
}

export const supabase: SupabaseClient<any, any, any> = (() => {
    console.log('Supabase: isSupabaseConfigured', isSupabaseConfigured);
    console.log('Supabase: supabaseUrl', supabaseUrl);
    console.log('Supabase: supabaseAnonKey', supabaseAnonKey);
    return isSupabaseConfigured
        ? (() => {
            console.log('Supabase: Creating Supabase client');
            try {
                const client = createClient(supabaseUrl!, supabaseAnonKey!);
                console.log('Supabase: Supabase client created successfully');
                return client;
            } catch (error) {
                console.error('Supabase: Error creating Supabase client', error);
                return createMockSupabaseClient();
            }
        })()
        : createMockSupabaseClient();
    })();

export { isSupabaseConfigured };
