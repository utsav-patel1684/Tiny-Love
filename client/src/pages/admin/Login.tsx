import React, { useState } from 'react';

interface LoginProps {
    onLoginSuccess: (token: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('https://tinylove.replit.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid admin credentials');
            }

            // // ✨ CRUCIAL SECURITY CHECK: Verify if the user profile has administrative rights
            // if (data.user && data.user.isAdmin !== true) {
            //     throw new Error('Access Denied: You do not have administrator permissions.');
            // }

            if (data.token) {
                localStorage.setItem('admin_token', data.token);
                onLoginSuccess(data.token);
            } else {
                throw new Error('No authentication token received');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Tiny Love Admin</h2>
                    <p className="text-sm text-white/70 mt-1">Sign in to access control panel</p>
                </div>

                {error && (
                    <div className="mb-6 p-3.5 rounded-lg bg-destructive/20 border border-destructive/50 text-white text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-white/70 tracking-wider uppercase mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-[#EBA545] transition-colors"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-white/70 tracking-wider uppercase mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-[#EBA545] transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-2 bg-[#EBA545] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-all focus:outline-none shadow-md"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}