import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    AiIcon,
    SendIcon,
    SparklesIcon,
    UserIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    PlusIcon,
    EditIcon,
} from './icons';
import { generateAiResponse, generateEmbedding } from '../services/geminiService';
import { Contact, Deal, AiContextSnapshot, AiDocumentMatch, AiSessionSummary, AiMessageRecord } from '../types';
import {
    createAiSession,
    logAiMessage,
    submitAiFeedback,
    listAiSessions,
    fetchAiSessionMessages,
    renameAiSession,
} from '../services/aiService';
import { fetchAiContextSnapshot, matchCrmDocuments } from '../services/aiKnowledgeService';

interface AIAssistantProps {
    context?: { contact?: Contact; deal?: Deal };
}

const DEFAULT_SESSION_TITLE = 'Cuoc tro chuyen moi';
const SESSION_FETCH_LIMIT = 30;

type ChatMessageRole = 'user' | 'assistant';

interface SessionItem extends AiSessionSummary {
    title: string;
}

interface ChatMessage {
    id: string;
    role: ChatMessageRole;
    text: string;
    createdAt: string;
    feedback?: -1 | 0 | 1;
}

const formatTimestamp = (value: string | null) => {
    if (!value) {
        return 'Chua co tuong tac';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString('vi-VN', { hour12: false });
};

const mapSessionTitle = (session: AiSessionSummary): string => {
    const rawTitle =
        typeof session.metadata?.title === 'string' ? session.metadata.title.trim() : '';
    return rawTitle.length > 0 ? rawTitle : DEFAULT_SESSION_TITLE;
};

const mapMessagesFromRecords = (records: AiMessageRecord[]): ChatMessage[] =>
    records.map((record) => ({
        id: record.id,
        role: record.role === 'user' ? 'user' : 'assistant',
        text: record.content,
        createdAt: record.createdAt ?? new Date().toISOString(),
        feedback: 0,
    }));

const truncateTitle = (value: string, maxLength: number = 60) => {
    const trimmed = value.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }
    return `${trimmed.slice(0, maxLength - 3)}...`;
};
const AIAssistant: React.FC<AIAssistantProps> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [contextSnapshot, setContextSnapshot] = useState<AiContextSnapshot | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
    const [renameDraft, setRenameDraft] = useState('');

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const buildSuggestions = useCallback((snapshot: AiContextSnapshot | null): string[] => {
        const ideas: string[] = [
            'Soan email cham soc khach hang moi',
            'De xuat ke hoach tuong tac voi team ban hang',
        ];
        if (snapshot?.topDeals?.length) {
            ideas.unshift(`De xuat chien luoc chot deal ${snapshot.topDeals[0].dealName}`);
        }
        if (snapshot?.upcomingTasks?.length) {
            ideas.unshift('Nhac toi cac cong viec sap den han');
        }
        if (snapshot?.totals?.openDeals && snapshot.totals.openDeals > 0) {
            ideas.unshift('Tom tat pipeline va cac deal dang mo');
        }
        return Array.from(new Set(ideas)).slice(0, 4);
    }, []);

    const loadSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const data = await listAiSessions(SESSION_FETCH_LIMIT);
            const nextSessions: SessionItem[] = data.map((session) => ({
                ...session,
                metadata: session.metadata ?? null,
                title: mapSessionTitle(session),
            }));
            setSessions(nextSessions);
            setActiveSessionId((prev) => {
                if (!nextSessions.length) {
                    return null;
                }
                if (prev && nextSessions.some((item) => item.id === prev)) {
                    return prev;
                }
                return nextSessions[0].id;
            });
        } catch (error) {
            console.error('Failed to load AI sessions', error);
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    const loadMessagesForSession = useCallback(
        async (sessionId: string) => {
            if (sessionId.startsWith('local-')) {
                return;
            }
            setMessagesLoading(true);
            let cancelled = false;
            try {
                const records = await fetchAiSessionMessages(sessionId);
                if (!cancelled) {
                    setMessages(mapMessagesFromRecords(records));
                }
            } catch (error) {
                console.error('Failed to load session messages', error);
            } finally {
                if (!cancelled) {
                    setMessagesLoading(false);
                }
            }
            return () => {
                cancelled = true;
            };
        },
        [],
    );
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        loadSessions();
    }, [isOpen, loadSessions]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (!contextSnapshot) {
            let cancelled = false;
            const load = async () => {
                const snapshot = await fetchAiContextSnapshot();
                if (!cancelled) {
                    setContextSnapshot(snapshot);
                    setSuggestions(buildSuggestions(snapshot));
                }
            };
            load();
            return () => {
                cancelled = true;
            };
        }
        setSuggestions(buildSuggestions(contextSnapshot));
    }, [isOpen, contextSnapshot, buildSuggestions]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (!activeSessionId) {
            setMessages([]);
            return;
        }
        const cleanup = loadMessagesForSession(activeSessionId);
        return () => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [activeSessionId, isOpen, loadMessagesForSession]);

    const handleSelectSession = (sessionId: string) => {
        if (sessionId === activeSessionId) {
            return;
        }
        setRenamingSessionId(null);
        setMessages([]);
        setActiveSessionId(sessionId);
    };
    const handleStartNewSession = useCallback(async (): Promise<string | null> => {
        const metadata: Record<string, unknown> = { title: DEFAULT_SESSION_TITLE };
        if (context?.contact) {
            metadata.contactId = context.contact.id;
        }
        if (context?.deal) {
            metadata.dealId = context.deal.id;
        }

        const newSessionId = await createAiSession('assistant', metadata);
        if (!newSessionId) {
            return null;
        }

        const greeting = 'Hello! How can I help you with your sales tasks today?';
        const createdAt = new Date().toISOString();

        try {
            await logAiMessage(newSessionId, 'assistant', greeting);
        } catch (error) {
            console.error('Failed to log greeting for new session', error);
        }

        setSessions((prev) => [
            {
                id: newSessionId,
                createdAt,
                lastInteractionAt: createdAt,
                metadata,
                title: metadata.title as string,
            },
            ...prev.filter((session) => session.id !== newSessionId),
        ]);
        setActiveSessionId(newSessionId);
        setMessages([
            {
                id: `local-greeting-${Date.now()}`,
                role: 'assistant',
                text: greeting,
                createdAt,
                feedback: 0,
            },
        ]);

        loadSessions();
        return newSessionId;
    }, [context, loadSessions]);

    const beginRenameSession = (session: SessionItem) => {
        setRenamingSessionId(session.id);
        setRenameDraft(session.title);
    };

    const cancelRenameSession = () => {
        setRenamingSessionId(null);
        setRenameDraft('');
    };

    const commitRenameSession = useCallback(
        async (session: SessionItem) => {
            const nextTitle = renameDraft.trim();
            cancelRenameSession();
            if (!nextTitle || nextTitle === session.title) {
                return;
            }
            try {
                const metadata = await renameAiSession(session.id, nextTitle);
                setSessions((prev) =>
                    prev.map((item) =>
                        item.id === session.id
                            ? {
                                  ...item,
                                  metadata: metadata ?? { ...(item.metadata ?? {}), title: nextTitle },
                                  title:
                                      (metadata?.title &&
                                          typeof metadata.title === 'string' &&
                                          metadata.title.trim().length > 0
                                              ? metadata.title.trim()
                                              : nextTitle),
                              }
                            : item,
                    ),
                );
            } catch (error) {
                console.error('Failed to rename session', error);
            }
        },
        [renameDraft],
    );

    const updateSessionInteraction = (sessionId: string) => {
        const now = new Date().toISOString();
        setSessions((prev) =>
            prev.map((session) =>
                session.id === sessionId
                    ? {
                          ...session,
                          lastInteractionAt: now,
                      }
                    : session,
            ),
        );
    };

    const ensureSessionForMessage = useCallback(async (): Promise<string | null> => {
        if (activeSessionId) {
            return activeSessionId;
        }
        return handleStartNewSession();
    }, [activeSessionId, handleStartNewSession]);
    const handleSend = async (overrideText?: string) => {
        console.log("handleSend called");
        const rawInput = (overrideText ?? input).trim();
        console.log("handleSend input:", rawInput);
        if (!rawInput || isLoading) {
            return;
        }

        const session = await ensureSessionForMessage();
        if (!session) {
            console.warn('Unable to initialise AI session.');
            return;
        }

        const now = new Date().toISOString();
        const localUserMessageId = `local-user-${Date.now()}`;
        const userMessage: ChatMessage = {
            id: localUserMessageId,
            role: 'user',
            text: rawInput,
            createdAt: now,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        updateSessionInteraction(session);

        try {
            const messageId = await logAiMessage(session, 'user', rawInput);
            if (messageId) {
                setMessages((prev) =>
                    prev.map((message) =>
                        message.id === localUserMessageId ? { ...message, id: messageId } : message,
                    ),
                );
            }
        } catch (error) {
            console.error('Failed to log user message', error);
        }

        const currentSession = sessions.find((item) => item.id === session);
        if (currentSession && currentSession.title.startsWith(DEFAULT_SESSION_TITLE)) {
            const autoTitle = truncateTitle(rawInput);
            renameAiSession(session, autoTitle)
                .then((metadata) => {
                    setSessions((prev) =>
                        prev.map((item) =>
                            item.id === session
                                ? {
                                      ...item,
                                      metadata: metadata ?? { ...(item.metadata ?? {}), title: autoTitle },
                                      title:
                                          (metadata?.title &&
                                              typeof metadata.title === 'string' &&
                                              metadata.title.trim().length > 0
                                                  ? metadata.title.trim()
                                                  : autoTitle),
                                  }
                                : item,
                        ),
                    );
                })
                .catch((error) => console.error('Auto rename session failed', error));
        }

        setIsLoading(true);

        try {
            let snapshot = contextSnapshot;
            if (!snapshot) {
                snapshot = await fetchAiContextSnapshot();
                setContextSnapshot(snapshot);
            }
            if (snapshot) {
                setSuggestions(buildSuggestions(snapshot));
            }

            let searchResults: AiDocumentMatch[] = [];
            try {
                const embedding = await generateEmbedding(rawInput);
                if (embedding.length > 0) {
                    searchResults = await matchCrmDocuments(embedding, 5);
                }
            } catch (embeddingError) {
                console.error('Failed to generate embedding for AI prompt', embeddingError);
            }

            const aiResponseText = await generateAiResponse(rawInput, context, {
                searchResults,
                contextSnapshot: snapshot,
            });

            const aiMessageId = await logAiMessage(session, 'assistant', aiResponseText);
            const assistantMessage: ChatMessage = {
                id: aiMessageId ?? `local-ai-${Date.now()}`,
                role: 'assistant',
                text: aiResponseText,
                createdAt: new Date().toISOString(),
                feedback: 0,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI assistant error', error);
            const fallbackText = 'Sorry, I encountered an error. Please try again.';
            try {
                const messageId = await logAiMessage(session, 'assistant', fallbackText);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: messageId ?? `local-ai-error-${Date.now()}`,
                        role: 'assistant',
                        text: fallbackText,
                        createdAt: new Date().toISOString(),
                        feedback: 0,
                    },
                ]);
            } catch (logError) {
                console.error('Failed to log fallback response', logError);
            }
        } finally {
            setIsLoading(false);
            loadSessions();
        }
    };
    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSend(suggestion);
    };

    const handleFeedback = async (messageIndex: number, rating: -1 | 0 | 1) => {
        if (!activeSessionId) {
            return;
        }
        const target = messages[messageIndex];
        if (!target || target.role !== 'assistant') {
            return;
        }
        setMessages((prev) =>
            prev.map((message, index) =>
                index === messageIndex ? { ...message, feedback: rating } : message,
            ),
        );
        try {
            await submitAiFeedback(
                activeSessionId,
                target.id.startsWith('local-') ? null : target.id,
                rating,
            );
        } catch (error) {
            console.error('Failed to submit AI feedback', error);
        }
    };

    const showChatPlaceholder =
        !messagesLoading && messages.length === 0 && !isLoading && suggestions.length > 0;

    return (
        <>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-8 right-8 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors p-4 flex items-center justify-center"
                aria-label="Open AI assistant"
            >
                <SparklesIcon className="h-6 w-6" />
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[min(960px,calc(100%-2rem))] max-h-[80vh] z-50">
                    <div className="flex h-full bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
                        <aside className="w-64 bg-background-alt border-r border-border flex flex-col">
                            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-sm font-semibold text-text-primary">
                                        Lich su hoi thoai
                                    </div>
                                    <div className="text-[11px] text-text-secondary">
                                        Luu thanh tuong tac voi tro ly AI
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStartNewSession()}
                                    className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary-hover"
                                    type="button"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Moi
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {sessionsLoading ? (
                                    <div className="text-xs text-text-secondary px-2 py-3">
                                        Dang tai danh sach hoi thoai...
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-xs text-text-secondary px-2 py-3">
                                        Chua co hoi thoai nao. Hay bat dau mot cuoc tro chuyen moi.
                                    </div>
                                ) : (
                                    sessions.map((session) => {
                                        const isActive = session.id === activeSessionId;
                                        return (
                                            <button
                                                key={session.id}
                                                type="button"
                                                onClick={() => handleSelectSession(session.id)}
                                                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                                                    isActive
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-transparent hover:bg-secondary/20'
                                                }`}
                                            >
                                                {renamingSessionId === session.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            value={renameDraft}
                                                            onChange={(event) =>
                                                                setRenameDraft(event.target.value)
                                                            }
                                                            onBlur={() => commitRenameSession(session)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter') {
                                                                    event.preventDefault();
                                                                    commitRenameSession(session);
                                                                }
                                                                if (event.key === 'Escape') {
                                                                    event.preventDefault();
                                                                    cancelRenameSession();
                                                                }
                                                            }}
                                                            autoFocus
                                                            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-semibold text-text-primary truncate">
                                                                {session.title}
                                                            </div>
                                                            <div className="text-[11px] text-text-secondary">
                                                                {formatTimestamp(
                                                                    session.lastInteractionAt,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                beginRenameSession(session);
                                                            }}
                                                            className="text-text-secondary hover:text-text-primary"
                                                            aria-label="Rename session"
                                                        >
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </aside>

                        <div className="flex-1 flex flex-col bg-background">
                            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                                <div className="bg-primary p-2 rounded-full text-white">
                                    <AiIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-text-primary">
                                        Stellar AI Assistant
                                    </h2>
                                    <p className="text-xs text-text-secondary">
                                        Soan email, tom tat pipeline va giai dap cau hoi ve khach hang.
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="text-xs bg-secondary/40 text-text-primary px-3 py-1.5 rounded-full hover:bg-secondary/60 transition-colors"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {messagesLoading && (
                                    <div className="text-xs text-text-secondary">
                                        Dang tai lich su hoi thoai...
                                    </div>
                                )}

                                {showChatPlaceholder && (
                                    <div className="text-sm text-text-secondary">
                                        Dat cau hoi hoac su dung cac goi y ben tren de bat dau.
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isUser = msg.role === 'user';
                                    const showFeedback = msg.role === 'assistant';
                                    return (
                                        <div
                                            key={msg.id ?? index}
                                            className={`flex items-start gap-3 ${
                                                isUser ? 'flex-row-reverse' : ''
                                            }`}
                                        >
                                            <div
                                                className={`p-2 rounded-full ${
                                                    isUser
                                                        ? 'bg-secondary text-text-primary'
                                                        : 'bg-primary text-white'
                                                }`}
                                            >
                                                {isUser ? (
                                                    <UserIcon className="h-5 w-5" />
                                                ) : (
                                                    <SparklesIcon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-md ${
                                                    isUser
                                                        ? 'bg-secondary text-text-primary rounded-br-none'
                                                        : 'bg-background-alt text-text-primary rounded-bl-none'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                                {showFeedback && (
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <button
                                                            className={`p-1 rounded-full border transition-colors ${
                                                                msg.feedback === 1
                                                                    ? 'bg-green-600/20 border-green-400 text-green-300'
                                                                    : 'border-transparent text-text-secondary hover:text-green-300 hover:border-green-500/40'
                                                            }`}
                                                            onClick={() => handleFeedback(index, 1)}
                                                            aria-label="Thumbs up"
                                                        >
                                                            <ThumbsUpIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className={`p-1 rounded-full border transition-colors ${
                                                                msg.feedback === -1
                                                                    ? 'bg-red-600/20 border-red-400 text-red-300'
                                                                    : 'border-transparent text-text-secondary hover:text-red-300 hover:border-red-500/40'
                                                            }`}
                                                            onClick={() => handleFeedback(index, -1)}
                                                            aria-label="Thumbs down"
                                                        >
                                                            <ThumbsDownIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isLoading && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary p-2 rounded-full">
                                            <AiIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="max-w-xs rounded-lg px-4 py-2 bg-secondary text-text-primary rounded-bl-none">
                                            <div className="flex items-center space-x-1">
                                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            <div className="px-6 py-4 border-t border-border bg-background-alt/40">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        placeholder="Ask AI to draft an email..."
                                        className="w-full bg-background border border-border rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary p-2 rounded-full hover:bg-primary-hover disabled:bg-secondary"
                                        disabled={isLoading}
                                        aria-label="Send message"
                                    >
                                        <SendIcon className="h-5 w-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;
