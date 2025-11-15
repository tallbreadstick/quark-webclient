import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";

export default function LoginPage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);


    // send login request to backend
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const body = {
            identifier: String(formData.get('identifier') || ''),
            password: String(formData.get('password') || '')
        };

        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Login failed');
            }

            const data = await res.json();
            // store session in parent state and navigate to home
            setUserSession(data);
            navigate("/");
        } catch (err: any) {
            setError(err?.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    

    return (
        <Page title="Quark | Login" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-8">
                    <h1 className="text-2xl font-semibold mb-6 text-center text-[#bdcdff]">Sign in to your account</h1>

                    <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Email or Username</label>

                    <input name="identifier" required className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]" />

                    <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Password</label>
                    <div className="relative w-full">
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full px-4 pr-10 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-pressed={showPassword}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                                className="h-5 w-5 translate-y-[-8px] flex items-center justify-center text-gray-300 hover:text-white focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9-4-9-7s4-7 9-7c1.29 0 2.52.24 3.66.67" />
                                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2 2l20 20" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
                                        <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="remember" className="w-4 h-4" />
                            <p className="text-[#bdcdff]">Remember me</p>
                        </label>
                        <a href="/forgot" className="text-sm text-[#4d538b] hover:underline text-[#bdcdff]">Forgot Password?</a>
                    </div>
                    
                            {error && <div className="mb-4 text-sm text-red-400 text-center">{error}</div>}
                            <button type="submit" disabled={submitting} className="w-full px-4 py-2 bg-[#566fb8] text-white rounded-md font-semibold hover:bg-[#bdcdff] transition">
                                {submitting ? 'Signing in...' : 'Sign in'}
                            </button>
                    <p className="mt-4 text-center text-sm text-white">Don't have an account? <a href="/register" className="text-[#bccdff] font-semibold">Register</a></p>
                </form>
            </div>
        </Page>
    );
}
