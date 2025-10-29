import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AiSessionSummary {
    id: string;
    created_at: string | null;
    created_by: string | null;
    channel: string | null;
    last_interaction_at: string | null;
    metadata: Record<string, unknown> | null;
    total_messages: number | null;
    user_messages: number | null;
    assistant_messages: number | null;
    total_tokens: number | null;
    average_rating: number | null;
    positive_feedback: number | null;
    negative_feedback: number | null;
}

export const fetchAiSessionSummary = async (): Promise<AiSessionSummary[]> => {
    if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. AI analytics will return an empty dataset.');
        return [];
    }

    const { data, error } = await supabase
        .from('ai_session_summary')
        .select('*')
        .order('last_interaction_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch AI session summary', error);
        return [];
    }

    return (data as any[]) as AiSessionSummary[];
};

export interface AiDailyUsage {
    day: string;
    channel: string | null;
    sessions: number;
    messages: number;
    positive_feedback: number;
    negative_feedback: number;
}

export const fetchAiDailyUsage = async (): Promise<AiDailyUsage[]> => {
    if (!isSupabaseConfigured) {
        return [];
    }

    const { data, error } = await supabase.rpc('ai_usage_by_day');
    if (error) {
        console.error('Failed to fetch AI usage by day', error);
        return [];
    }

    return (data as any[]) as AiDailyUsage[];
};
