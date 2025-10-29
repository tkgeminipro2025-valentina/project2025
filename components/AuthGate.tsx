import React, { useEffect, useState } from 'react';

interface AuthGateProps {
    onSignIn: (email: string, password: string) => Promise<void>;
    onSignUp: (email: string, password: string, fullName?: string) => Promise<void>;
    isSubmitting: boolean;
    error?: string | null;
    notice?: string | null;
    pendingEmail?: string | null;
}

type AuthMode = 'signin' | 'signup';

const AuthGate: React.FC<AuthGateProps> = ({ onSignIn, onSignUp, isSubmitting, error, notice, pendingEmail }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [mode, setMode] = useState<AuthMode>('signin');
    const [hasPendingConfirmation, setHasPendingConfirmation] = useState(false);

    useEffect(() => {
        if (pendingEmail) {
            setMode('signin');
            setEmail(pendingEmail);
            setPassword('');
            setFullName('');
            setHasPendingConfirmation(true);
            setFormError(null);
        }
    }, [pendingEmail]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            setFormError('Vui long nhap email va mat khau.');
            return;
        }
        if (mode === 'signup' && fullName.trim().length === 0) {
            setFormError('Vui long nhap ho ten day du.');
            return;
        }

        setFormError(null);
        try {
            if (mode === 'signup') {
                await onSignUp(trimmedEmail, password, fullName.trim());
            } else {
                setHasPendingConfirmation(false);
                await onSignIn(trimmedEmail, password);
            }
        } catch {
            // parent surfaces error
        }
    };

    const activeError = formError || error;
    const ctaLabel = mode === 'signup' ? 'Dang ky' : 'Dang nhap';
    const submittingLabel = mode === 'signup' ? 'Dang dang ky...' : 'Dang dang nhap...';
    const toggleLabel = mode === 'signup' ? 'Da co tai khoan? Dang nhap' : 'Chua co tai khoan? Dang ky';

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text-primary">
            <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-8 shadow-lg space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">
                        {mode === 'signup' ? 'Dang ky tai khoan CRM' : 'Dang nhap CRM'}
                    </h2>
                    <p className="text-sm text-text-secondary mt-2">
                        {mode === 'signup'
                            ? 'Nhap email, mat khau va ho ten de tao tai khoan moi.'
                            : 'Su dung tai khoan Supabase (email/password) duoc cap quyen.'}
                    </p>
                </div>

                {activeError && (
                    <div className="text-sm px-3 py-2 rounded-md border border-red-500/40 bg-red-500/10 text-red-200">
                        {activeError}
                    </div>
                )}

                {notice && !activeError && (
                    <div className="text-sm px-3 py-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                        {notice}
                    </div>
                )}

                {hasPendingConfirmation && !activeError && (
                    <div className="text-sm px-3 py-2 rounded-md border border-sky-500/40 bg-sky-500/10 text-sky-100">
                        <p>
                            Da gui email xac nhan toi <span className="font-semibold">{pendingEmail}</span>. Vui long mo hop thu (hoac thư mục spam) và nhấp vào liên kết để kích hoạt tài khoản trước khi đăng nhập.
                        </p>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col space-y-1">
                        <label className="text-sm font-semibold" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="admin@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>
                    {mode === 'signup' && (
                        <div className="flex flex-col space-y-1">
                            <label className="text-sm font-semibold" htmlFor="fullName">Ho ten</label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                className="w-full rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                                placeholder="Tran Van A"
                                autoComplete="name"
                                required
                            />
                        </div>
                    )}
                    <div className="flex flex-col space-y-1">
                        <label className="text-sm font-semibold" htmlFor="password">Mat khau</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-md border border-border bg-background-alt px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Nhap mat khau"
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {isSubmitting ? submittingLabel : ctaLabel}
                    </button>
                </form>

                <div className="flex flex-col space-y-2 text-xs text-text-secondary">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signup' ? 'signin' : 'signup');
                            setFormError(null);
                            if (mode === 'signin') {
                                setHasPendingConfirmation(false);
                                setEmail('');
                                setPassword('');
                            }
                        }}
                        className="text-primary hover:underline text-sm self-start"
                    >
                        {toggleLabel}
                    </button>
                    <p>
                        Quan tri vien co the quan ly role va quyen han trong trang Users sau khi dang nhap.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthGate;
