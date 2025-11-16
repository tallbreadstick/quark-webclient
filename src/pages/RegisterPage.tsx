import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import api from "../scripts/api";

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
        const body = {
            username: String(formData.get('username') || ''),
            email: String(formData.get('email') || ''),
            password: String(formData.get('password') || ''),
            userType: String(formData.get('userType') || ''),
        };

        try {
            await api.post("/auth/register", body);
            // registration successful — redirect to login page
            navigate("/login");
        } catch (err: any) {
            const msg = err?.response?.data || err?.message || 'An error occurred';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Email</label>
                            <input name="email" type="email" required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]" />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Username</label>
                            <input name="username" required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]" />
                        </div>


                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">User Type</label>
                            <div className="relative">
                                <select
                                    name="userType"
                                    required
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b] appearance-none"
                                >
                                    <option value="" disabled className="text-left text-black">Select User Type</option>
                                    <option value="learner" className="text-left text-black">Learner</option>
                                    <option value="educator" className="text-left text-black">Educator</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Password</label>
                            <input name="password" type="password" required className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Confirm Password</label>
                            <input name="confirmPassword" type="password" required className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-8">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="remember" className="w-4 h-4" />
                            <p className="text-[#bdcdff]">Remember me</p>
                        </label>
                        <a href="/forgot" className="text-sm text-[#4d538b] hover:underline text-[#bdcdff]">Forgot Password?</a>
                    </div>
                    
                    <button type="submit" disabled={submitting} className="w-full px-4 py-2 bg-[#566fb8] text-white rounded-md font-semibold hover:bg-[#bdcdff] transition">
                        {submitting ? "Creating..." : "Create account"}
                    </button>
                    <p className="mt-4 text-center text-sm text-white">Already have an account? <a href="/login" className="text-[#bccdff] font-semibold">Sign in</a></p>
                </form>
            </div>
        </Page>
    );
}