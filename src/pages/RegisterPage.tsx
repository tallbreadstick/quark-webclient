import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import { register as registerEndpoint } from "../endpoints/UserHandler";

import AlertModal from "../components/modals/AlertModal";

export default function RegisterPage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        const username = String(formData.get("username") || "");
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");
        const confirmPassword = String(formData.get("confirmPassword") || "");
        const userType = String(formData.get("userType") || "") as "EDUCATOR" | "STUDENT";

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setSubmitting(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setSubmitting(false);
            return;
        }

        const body = { username, email, password, userType };

        try {
            const res = await registerEndpoint(body);

            if (res.status === "OK") {
                setShowSuccessModal(true);
            } else {
                const backendErr = res.err ?? "Registration failed";
                setError(
                    typeof backendErr === "string" && backendErr.length > 200
                        ? "Registration failed. Please check your input and try again."
                        : String(backendErr)
                );
            }
        } catch (err: any) {
            const raw = err?.response?.data || err?.message || "An error occurred";
            setError(typeof raw === "string" ? raw : JSON.stringify(raw));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate("/login");
    };

    return (
        <Page title="Quark | Register" userSession={userSession} setUserSession={setUserSession}>
            
            {/* Success Modal */}
            <AlertModal
                isOpen={showSuccessModal}
                onClose={handleSuccessClose}
                title="Account Created!"
                message="Your account has been successfully registered."
                variant="success"
                buttonText="Proceed to Login"
            />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <form 
                    onSubmit={handleSubmit} 
                    className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-8"
                >
                    <h1 className="text-2xl font-semibold mb-6 text-center text-[#bdcdff]">
                        Create your account
                    </h1>

                    {/* ERROR BOX MATCHING LOGIN PAGE */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                focus:ring-blue-500 transition cursor-text"
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Username + User Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                    Username
                                </label>
                                <input
                                    name="username"
                                    required
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                    text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 transition cursor-text"
                                    placeholder="Choose a username"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                    User Type
                                </label>
                                <select
                                    name="userType"
                                    required
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                    text-white focus:outline-none focus:ring-2 focus:ring-blue-500 
                                    transition appearance-none cursor-pointer pr-10 
                                    [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600"
                                >
                                    <option value="STUDENT">Learner</option>
                                    <option value="EDUCATOR">Educator</option>
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                Password
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                focus:ring-blue-500 transition cursor-text"
                                placeholder="Create a password"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-[#bdcdff] cursor-pointer">
                                Confirm Password
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                                text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                                focus:ring-blue-500 transition cursor-text"
                                placeholder="Confirm your password"
                            />
                        </div>
                    </div>

                    {/* BUTTON WITH POINTER CURSOR */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg 
                        font-semibold hover:bg-blue-700 transition disabled:opacity-50 
                        disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting ? "Creating Account..." : "Create Account"}
                    </button>

                    <p className="mt-4 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="text-[#bdcdff] font-semibold hover:text-blue-300 hover:underline transition cursor-pointer"
                        >
                            Sign in
                        </a>
                    </p>
                </form>
            </div>
        </Page>
    );
}
