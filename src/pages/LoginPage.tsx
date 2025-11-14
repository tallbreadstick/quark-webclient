import { useState } from "react";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";

export default function LoginPage() {
    const { userSession, setUserSession } = loadSessionState();
    const isLoggedIn = userSession !== null; // adjust to your session structure
    const [showPassword, setShowPassword] = useState(false);


    // change to handle the thing properly !!!
    const handleSubmit = (e: any) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const payload = {
            identifier: formData.get("identifier"),
            password: formData.get("password"),
            remember: formData.get("remember") === "on",
        };
        // Replace with real auth call
        // eslint-disable-next-line no-console
        console.log("Login submit:", payload);
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
                        <div className="absolute inset-y-0 right-6 flex items-center">
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
                    
                    <button type="submit" className="w-full px-4 py-2 bg-[#bdcdff] text-white rounded-md font-semibold hover:bg-[#3f3f6b] transition">Sign in</button>
                    <p className="mt-4 text-center text-sm text-white">Don't have an account? <a href="/register" className="text-[#bccdff] font-semibold">Register</a></p>
                </form>
            </div>
        </Page>
    );
}
