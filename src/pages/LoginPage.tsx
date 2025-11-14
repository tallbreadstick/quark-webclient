import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";

export default function LoginPage() {
    const { userSession, setUserSession } = loadSessionState();
    const isLoggedIn = userSession !== null; // adjust to your session structure


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
                    <input name="password" type="password" required className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4d538b]" />
                    
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
