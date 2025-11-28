import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import { register as registerEndpoint } from "../endpoints/UserHandler";

export default function RegisterPage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // submit registration to backend
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const username = String(formData.get('username') || '');
        const email = String(formData.get('email') || '');
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirmPassword') || '');
        const userType = (String(formData.get('userType') || '') as unknown) as "EDUCATOR" | "STUDENT";

        // Client-side validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setSubmitting(false);
            return;
        }

        const minPasswordLength = 8;
        if (password.length < minPasswordLength) {
            setError(`Password must be at least ${minPasswordLength} characters`);
            setSubmitting(false);
            return;
        }

        const body = { username, email, password, userType };

        try {
            const res = await registerEndpoint(body);

            if (res.status === "OK") {
                // registration successful — redirect to login page
                navigate("/login");
            } else {
                // Backend may return verbose errors; normalize them
                const backendErr = res.err ?? 'Registration failed';
                // If backend provides a long stack trace, show a friendly message
                if (typeof backendErr === 'string' && backendErr.length > 200) {
                    setError('Registration failed. Please check your input and try again.');
                } else {
                    setError(String(backendErr));
                }
            }
        } catch (err: any) {
            // Sanitize error messages so we don't display stack traces
            const raw = err?.response?.data || err?.message || 'An error occurred';
            if (typeof raw === 'string') {
                if (raw.length > 200) setError('Registration failed. Please check your input and try again.');
                else setError(raw);
            } else if (raw && typeof raw === 'object') {
                // try to extract a sensible message
                const maybeMsg = (raw.message || raw.error || JSON.stringify(raw));
                setError(String(maybeMsg));
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Page title="Quark | Register" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-8">
                    <h1 className="text-2xl font-semibold mb-6 text-center text-[#bdcdff]">Create your account</h1>

                    {error && <div className="mb-4 text-sm text-red-400 text-center">{error}</div>}

                    <div className="space-y-4">
                        {/* Email - Full width on first row */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Email</label>
                            <input 
                                name="email" 
                                type="email" 
                                required 
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text" 
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Username and User Type - 2-column grid on second row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Username</label>
                                <input 
                                    name="username" 
                                    required 
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text" 
                                    placeholder="Choose a username"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff]">User Type</label>
                                <div className="relative">
                                    <select
                                        name="userType"
                                        required
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-10 transition [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 cursor-pointer"
                                    >
                                        <option value="" disabled className="text-gray-400">Select User Type</option>
                                        <option value="STUDENT">Learner</option>
                                        <option value="EDUCATOR">Educator</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password fields - Full width on separate rows */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Password</label>
                            <input 
                                name="password" 
                                type="password" 
                                required 
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text" 
                                placeholder="Create a password"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Confirm Password</label>
                            <input 
                                name="confirmPassword" 
                                type="password" 
                                required 
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text" 
                                placeholder="Confirm your password"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-8 mt-6">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="remember" 
                                className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" 
                            />
                            <p className="text-[#bdcdff]">Remember me</p>
                        </label>
                        <a href="/forgot" className="text-sm text-[#bdcdff] hover:underline hover:text-blue-300 transition cursor-pointer">Forgot Password?</a>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={submitting} 
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting ? "Creating Account..." : "Create Account"}
                    </button>
                    
                    <p className="mt-4 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <a href="/login" className="text-[#bdcdff] font-semibold hover:text-blue-300 hover:underline transition cursor-pointer">
                            Sign in
                        </a>
                    </p>
                </form>
            </div>
        </Page>
    );
}