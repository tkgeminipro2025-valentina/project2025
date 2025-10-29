import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend, BarChart, Bar } from 'recharts';
import { fetchAiSessionSummary, fetchAiDailyUsage, AiSessionSummary, AiDailyUsage } from '../services/analyticsService';

const Analytics: React.FC = () => {
    const [sessions, setSessions] = useState<AiSessionSummary[]>([]);
    const [dailyUsage, setDailyUsage] = useState<AiDailyUsage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [summary, usage] = await Promise.all([
                    fetchAiSessionSummary(),
                    fetchAiDailyUsage(),
                ]);
                if (isMounted) {
                    setSessions(summary);
                    setDailyUsage(usage);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError('Unable to load AI analytics. Please check Supabase configuration.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    const aggregates = useMemo(() => {
        if (!sessions.length) {
            return {
                totalSessions: 0,
                totalMessages: 0,
                totalTokens: 0,
                satisfaction: null as number | null,
            };
        }

        const totalSessions = sessions.length;
        const totalMessages = sessions.reduce((sum, session) => sum + (session.total_messages ?? 0), 0);
        const totalTokens = sessions.reduce((sum, session) => sum + (session.total_tokens ?? 0), 0);
        const ratedSessions = sessions.filter(session => typeof session.average_rating === 'number');
        const satisfaction = ratedSessions.length
            ? ratedSessions.reduce((sum, session) => sum + (session.average_rating ?? 0), 0) / ratedSessions.length
            : null;

        return { totalSessions, totalMessages, totalTokens, satisfaction };
    }, [sessions]);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">AI Analytics</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Monitor conversation volume, satisfaction, and intensity of the AI assistant.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-surface border border-border rounded-lg p-6 text-text-secondary">
                    Loading telemetry...
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-6 text-red-200">
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <StatCard title="Sessions" value={aggregates.totalSessions.toString()} description="Tracked assistant conversations" />
                        <StatCard title="Total Messages" value={aggregates.totalMessages.toString()} description="User + assistant messages" />
                        <StatCard title="Total Tokens" value={aggregates.totalTokens.toLocaleString()} description="Tokens consumed (if tracked)" />
                        <StatCard
                            title="Average Satisfaction"
                            value={
                                aggregates.satisfaction === null
                                    ? 'N/A'
                                    : `${(aggregates.satisfaction * 100).toFixed(0)}%`
                            }
                            description="Based on thumbs up/down feedback"
                        />
                    </div>

                    <div className="bg-surface border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Usage trend</h2>
                        {dailyUsage.length ? (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyUsage} margin={{ left: -16, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2f2f36" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#9ca3af"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2933', border: '1px solid #374151' }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="sessions" stroke="#6366f1" name="Sessions" dot={false} strokeWidth={2} />
                                        <Line type="monotone" dataKey="messages" stroke="#f59e0b" name="Messages" dot={false} strokeWidth={2} />
                                        <Line type="monotone" dataKey="positive_feedback" stroke="#10b981" name="Thumbs Up" dot={false} strokeWidth={2} />
                                        <Line type="monotone" dataKey="negative_feedback" stroke="#ef4444" name="Thumbs Down" dot={false} strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="text-sm text-text-secondary">No telemetry available to chart yet.</div>
                        )}
                    </div>

                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-secondary/30 text-sm text-text-secondary uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3">Session</th>
                                    <th className="px-4 py-3">Channel</th>
                                    <th className="px-4 py-3">Messages</th>
                                    <th className="px-4 py-3">Tokens</th>
                                    <th className="px-4 py-3">Thumbs&nbsp;Up</th>
                                    <th className="px-4 py-3">Thumbs&nbsp;Down</th>
                                    <th className="px-4 py-3">Avg Rating</th>
                                    <th className="px-4 py-3">Last Interaction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {sessions.map((session, index) => (
                                    <tr key={session.id ?? `session-${index}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-text-primary">{session.id?.slice(0, 8)}</div>
                                            <div className="text-xs text-text-secondary">
                                                {session.created_at ? new Date(session.created_at).toLocaleString() : '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 capitalize text-text-secondary">{session.channel ?? 'assistant'}</td>
                                        <td className="px-4 py-3">{session.total_messages ?? 0}</td>
                                        <td className="px-4 py-3">{(session.total_tokens ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3">{session.positive_feedback ?? 0}</td>
                                        <td className="px-4 py-3">{session.negative_feedback ?? 0}</td>
                                        <td className="px-4 py-3">
                                            {session.average_rating === null ? '-' : `${(session.average_rating * 100).toFixed(0)}%`}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {session.last_interaction_at
                                                ? new Date(session.last_interaction_at).toLocaleString()
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {!sessions.length && (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-text-secondary" colSpan={8}>
                                            No assistant conversations have been logged yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; description: string }> = ({ title, value, description }) => (
    <div className="bg-surface border border-border rounded-lg p-4">
        <div className="text-sm text-text-secondary uppercase tracking-wide">{title}</div>
        <div className="text-2xl font-bold mt-2 text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary mt-1">{description}</div>
    </div>
);

export default Analytics;
