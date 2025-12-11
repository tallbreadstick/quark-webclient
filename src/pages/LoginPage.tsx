import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import { login as loginEndpoint, fetchUsers } from "../endpoints/UserHandler";
import { fetchProfilePicture, fetchBio } from "../endpoints/ProfileHandler";

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
            const res = await loginEndpoint(body);

            if (res.status === "OK" && res.ok) {
                // store only the slim session returned from the auth endpoint

                // start with the basic session
                const slim = {
                    jwt: res.ok.jwt,
                    username: res.ok.username,
                    email: res.ok.email,
                };

                // try to enrich the session with profile picture and bio — backend keeps these under profile endpoints
                try {
                    const lookupId = slim.username || slim.email;
                    const usersRes = await fetchUsers(lookupId);
                    if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
                        const profile = usersRes.ok[0];
                        // fetch picture and bio if available
                        const pictureRes = await fetchProfilePicture(profile.id);
                        if (pictureRes.status === "OK" && pictureRes.ok) {
                            const raw = pictureRes.ok;
                            // if backend returns just base64, prefix it so browsers can render it as a data url
                            const dataUrl = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
                            // store into session
                            (slim as any).profilePictureUrl = dataUrl;
                        }

                        const bioRes = await fetchBio(profile.id);
                        if (bioRes.status === "OK" && bioRes.ok) {
                            (slim as any).bio = bioRes.ok;
                        }
                    }
                } catch (e) {
                    // silently ignore enrichment failures — login itself succeeded
                }

                setUserSession(slim);

                navigate("/");
            } else {
                throw new Error(res.err ?? "Login failed");
            }

        } catch (err: any) {
            const msg = err?.response?.data || err?.message || 'An error occurred';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Page title="Quark | Login" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-8">
                    <h1 className="text-2xl font-semibold mb-6 text-center text-[#bdcdff]">Sign in to your account</h1>

                    {/* Error display at the top */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                Email or Username
                            </label>
                            <input 
                                name="identifier" 
                                required 
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text" 
                                placeholder="Enter your email or username"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-pressed={showPassword}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    title={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9-4-9-7s4-7 9-7c1.29 0 2.52.24 3.66.67" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l20 20" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6 mt-6">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="remember" 
                                className="w-4 h-4 bg-white/5 border border-white/10 rounded cursor-pointer accent-blue-500" 
                            />
                            <p className="text-[#bdcdff]">Remember me</p>
                        </label>
                        <a 
                            href="/forgot" 
                            className="text-sm text-[#bdcdff] hover:underline hover:text-blue-300 transition cursor-pointer"
                        >
                            Forgot Password?
                        </a>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting} 
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>
                    
                    <p className="mt-4 text-center text-sm text-gray-400">
                        Don't have an account?{" "}
                        <a 
                            href="/register" 
                            className="text-[#bdcdff] font-semibold hover:text-blue-300 hover:underline transition cursor-pointer"
                        >
                            Register
                        </a>
                    </p>
                </form>
            </div>
        </Page>
    );
}