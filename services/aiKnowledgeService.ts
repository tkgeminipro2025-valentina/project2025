import { supabase, isSupabaseConfigured } from './supabaseClient';
import { keysToCamel } from '../utils';
import type { AiDocumentMatch, AiContextSnapshot } from '../types';

export const matchCrmDocuments = async (
    embedding: number[],
    matchCount: number = 5,
    filterSource?: string | null
): Promise<AiDocumentMatch[]> => {
    if (!isSupabaseConfigured) {
        return [];
    }

    try {
        const { data, error } = await supabase.rpc('match_crm_documents', {
            query_embedding: embedding,
            match_count: matchCount,
            filter_source: filterSource ?? null,
        });

        if (error) {
            console.error('Failed to run match_crm_documents', error);
            return [];
        }

        return keysToCamel(data ?? []) as AiDocumentMatch[];
    } catch (error) {
        console.error('Unexpected error running match_crm_documents', error);
        return [];
    }
};

export const fetchAiContextSnapshot = async (): Promise<AiContextSnapshot | null> => {
    if (!isSupabaseConfigured) {
        return null;
    }

    try {
        const { data, error } = await supabase.rpc('crm_ai_context');
        if (error) {
            console.error('Failed to fetch AI context snapshot', error);
            return null;
        }
        return (data ? keysToCamel(data) : null) as AiContextSnapshot | null;
    } catch (error) {
        console.error('Unexpected error fetching AI context snapshot', error);
        return null;
    }
};
