import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { AiMessageRecord, AiSessionSummary, AiMessageRoleType } from '../types';

export type AiMessageRole = AiMessageRoleType;

const warnNotConfigured = () => {
    console.warn('Supabase is not configured. AI session logging is skipped.');
};

const generateLocalSessionId = () => {
    const random =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
    return `local-${random}`;
};

const invokeTelemetry = async <T>(action: string, payload: Record<string, unknown>): Promise<T | null> => {
    try {
        const { data, error } = await supabase.functions.invoke<T>('ai-telemetry', {
            body: { action, ...payload },
        });
        if (error) {
            console.error(`ai-telemetry ${action} error`, error);
            return null;
        }
        return data ?? null;
    } catch (error) {
        console.error(`Unexpected ai-telemetry ${action} failure`, error);
        return null;
    }
};

export const createAiSession = async (channel: string = 'assistant', metadata?: Record<string, unknown>): Promise<string | null> => {
    console.log("createAiSession called", channel, metadata);
    if (!isSupabaseConfigured) {
        warnNotConfigured();
        return generateLocalSessionId();
    }
    console.log("createAiSession: Supabase configured");

    try {
        console.log("createAiSession: Invoking telemetry");
        const response = await invokeTelemetry<{ sessionId: string }>('start_session', {
            channel,
            metadata: metadata ?? {},
        });
        console.log("createAiSession: Telemetry response", response);

        if (response?.sessionId) {
            return response.sessionId;
        }

        return generateLocalSessionId();
    } catch (error) {
        console.error('Unexpected error creating AI session', error);
        return generateLocalSessionId();
    } finally {
        console.log("createAiSession: finished");
    }
};

export const logAiMessage = async (sessionId: string, role: AiMessageRole, content: string, tokens?: number): Promise<string | null> => {
    console.log("logAiMessage called", sessionId, role, content, tokens);
    if (!isSupabaseConfigured) {
        warnNotConfigured();
        return null;
    }
    console.log("logAiMessage: Supabase configured");

    if (sessionId.startsWith('local-')) {
        return null;
    }

    try {
        console.log("logAiMessage: Invoking telemetry");
        const response = await invokeTelemetry<{ messageId?: string }>('log_message', {
            sessionId,
            role,
            content,
            tokens: tokens ?? null,
        });
        console.log("logAiMessage: Telemetry response", response);
        return response?.messageId ?? null;
    } catch (error) {
        console.error('Unexpected error logging AI message', error);
        return null;
    } finally {
        console.log("logAiMessage: finished");
    }
};

export const submitAiFeedback = async (sessionId: string, messageId: string | null, rating: -1 | 0 | 1, comment?: string) => {
    console.log("submitAiFeedback called", sessionId, messageId, rating, comment);
    if (!isSupabaseConfigured) {
        warnNotConfigured();
        return;
    }
    console.log("submitAiFeedback: Supabase configured");

    if (sessionId.startsWith('local-')) {
        return;
    }

    try {
        console.log("submitAiFeedback: Invoking telemetry");
        await invokeTelemetry('submit_feedback', {
            sessionId,
            messageId,
            rating,
            comment: comment ?? null,
        });
    } catch (error) {
        console.error('Unexpected error submitting AI feedback');
    } finally {
        console.log("submitAiFeedback: finished");
    }
};

export const touchAiSession = async (sessionId: string) => {
    console.log("touchAiSession called", sessionId);
    if (!isSupabaseConfigured || sessionId.startsWith('local-')) {
        console.log("touchAiSession: Supabase not configured or local session");
        return;
    }

    console.log("touchAiSession: Invoking telemetry");
    await invokeTelemetry('touch_session', { sessionId });
    console.log("touchAiSession: finished");
};

export const listAiSessions = async (limit: number = 30): Promise<AiSessionSummary[]> => {
    console.log("listAiSessions called", limit);
    if (!isSupabaseConfigured) {
        console.log("listAiSessions: Supabase not configured");
        return [];
    }

    console.log("listAiSessions: Invoking telemetry");
    const response = await invokeTelemetry<{ sessions?: AiSessionSummary[] }>('list_sessions', {
        limit,
    });
    console.log("listAiSessions response", response);
    return response?.sessions ?? [];
};

export const fetchAiSessionMessages = async (sessionId: string): Promise<AiMessageRecord[]> => {
    console.log("fetchAiSessionMessages called", sessionId);
    if (!isSupabaseConfigured || sessionId.startsWith('local-')) {
        console.log("fetchAiSessionMessages: Supabase not configured or local session");
        return [];
    }

    console.log("fetchAiSessionMessages: Invoking telemetry");
    const response = await invokeTelemetry<{ messages?: AiMessageRecord[] }>('get_session_messages', {
        sessionId,
    });
    console.log("fetchAiSessionMessages: Telemetry response", response);
    return response?.messages ?? [];
};

export const renameAiSession = async (sessionId: string, title: string): Promise<Record<string, unknown> | null> => {
    console.log("renameAiSession called", sessionId, title);
    if (!isSupabaseConfigured || sessionId.startsWith('local-')) {
        console.log("renameAiSession: Supabase not configured or local session");
        return null;
    }

    const trimmed = title.trim();
    if (!trimmed) {
        return null;
    }

    console.log("renameAiSession: Invoking telemetry");
    const response = await invokeTelemetry<{ metadata?: Record<string, unknown> }>('update_session', {
        sessionId,
        title: trimmed,
    });
    console.log("renameAiSession response", response);
    return response?.metadata ?? null;
};
