import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import api from "../scripts/api";

export default function CourseCreationPage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Submit course creation
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const form = e.currentTarget;
        const fd = new FormData(form);

        const name = String(fd.get("name") || "").trim();
        const description = String(fd.get("description") || "").trim() || null;
        const introduction = String(fd.get("introduction") || "").trim() || null;
        const tagsRaw = String(fd.get("tags") || "").trim();

        if (!name) {
            setError("Name is required.");
            setSubmitting(false);
            return;
        }

        const body: any = {
            name,
            description,
            introduction,
        };

        if (tagsRaw) {
            const ids = tagsRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => parseInt(s, 10))
                .filter((n) => !isNaN(n));
            if (ids.length) body.tagIds = ids;
        }

        try {
            const headers: Record<string, string> = {};
            if (userSession && userSession.jwt) {
                headers["Authorization"] = `Bearer ${userSession.jwt}`;
            }

            await api.post("/course", body, { headers });

            // on success navigate back to my-courses
            navigate("/my-courses");
        } catch (err: any) {
            const msg = err?.response?.data || err?.message || "Failed to create course";
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Page title="Quark | Create Course" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] flex items-center justify-center px-6 py-8 text-gray-200">
                <div className="max-w-3xl w-full mx-auto bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                    <h1 className="text-2xl font-semibold text-white mb-4 text-center">Create Course</h1>

                    {!userSession ? (
                        <div className="text-center text-gray-300">
                            <p className="mb-4">You must be signed in to create a course.</p>
                            <div className="flex justify-center gap-3">
                                <a href="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white cursor-pointer">Sign in</a>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && <div className="mb-4 text-sm text-red-400 text-center">{error}</div>}

                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
                            <input name="name" required className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white" />

                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Description</label>
                            <input name="description" className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white" />

                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Introduction</label>
                            <textarea name="introduction" rows={4} className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white" />

                            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Tag IDs (comma separated)</label>
                            <input name="tags" placeholder="e.g. 1,2,3" className="w-full px-4 py-2 mb-6 border rounded-md bg-black/20 text-white" />

                            <div className="flex justify-center">
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="px-6 py-3 bg-indigo-600 rounded-md text-white font-medium cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Creating..." : "Create Course"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Page>
    );
}