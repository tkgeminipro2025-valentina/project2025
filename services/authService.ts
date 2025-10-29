import { keysToCamel } from '../utils';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    console.log('getCurrentUserProfile: Starting');
    if (!isSupabaseConfigured) {
        console.log('getCurrentUserProfile: Supabase not configured');
        return null;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
        console.error('getCurrentUserProfile: Error fetching user', userError);
        throw userError;
    }

    const user = userData?.user;
    if (!user) {
        console.log('getCurrentUserProfile: No user found');
        return null;
    }

    console.log('getCurrentUserProfile: Fetching user profile from database');
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    console.log('getCurrentUserProfile: user_profiles query data', data);
    console.log('getCurrentUserProfile: user_profiles query error', error);

    if (error) {
        console.error('getCurrentUserProfile: Error fetching user profile', error);
        throw error;
    }

    console.log('getCurrentUserProfile: User profile found in database', data);

    if (!data) {
        console.log('getCurrentUserProfile: No user profile found in database, creating default profile');
        return {
            id: user.id,
            email: user.email ?? '',
            fullName: user.user_metadata?.full_name ?? null,
            role: 'staff',
            isAdmin: (() => {
                console.log('getCurrentUserProfile: user.app_metadata?.is_admin', user.app_metadata?.is_admin);
                console.log('getCurrentUserProfile: user.user_metadata?.is_admin', user.user_metadata?.is_admin);
                return Boolean(user.app_metadata?.is_admin ?? user.user_metadata?.is_admin);
            })(),
            createdAt: user.created_at ?? new Date().toISOString(),
            updatedAt: user.updated_at ?? new Date().toISOString(),
            lastSignInAt: user.last_sign_in_at ?? null,
        };
    }

    const profile = keysToCamel(data) as UserProfile;
    return {
        ...profile,
        isAdmin: (() => {
            console.log('getCurrentUserProfile: user.app_metadata?.is_admin', user.app_metadata?.is_admin);
            console.log('getCurrentUserProfile: user.user_metadata?.is_admin', user.user_metadata?.is_admin);
            return profile.isAdmin ?? Boolean(user.app_metadata?.is_admin ?? user.user_metadata?.is_admin);
        })(),
        lastSignInAt: user.last_sign_in_at ?? null,
    };
};
