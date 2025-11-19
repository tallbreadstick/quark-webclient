import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import api from "../scripts/api";

type Chapter = {
    id: number;
    name: string;
    number?: number;
    description?: string | null;
    icon?: string | null;
    [key: string]: any;
};

// JERRY READ HERE
// ngl idk how ts work
export default function ChapterPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const { userSession, setUserSession } = loadSessionState();
    const [chapters, setChapters] = useState<Chapter[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courseName, setCourseName] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        async function fetchChapters() {
            setLoading(true);
            setError(null);
            try {
                // Backend ChapterController exposes GET /api/chapter?courseId={courseId}
                const res = await api.get(`/chapter`, { params: { courseId } });
                const data = res.data;
                if (!cancelled) setChapters(Array.isArray(data) ? data : []);
            } catch (err: any) {
                // If unauthorized, show a friendly message instead of raw axios error
                if (!cancelled) {
                    const status = err?.response?.status;
                    if (status === 401 || status === 403) {
                        setError("Unauthorized — please sign in to view chapters.");
                    } else {
                        setError(err?.message || "Failed to load chapters");
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchChapters();
        // also try to load course name for the header
        (async function fetchCourse() {
            try {
                const res = await api.get(`/course/${courseId}`);
                if (!cancelled && res?.data?.name) setCourseName(res.data.name);
            } catch (e) {
                // ignore — header will fall back to generic title
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    return (
        <Page title={`Quark | Course ${courseId} — Chapters`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold text-white">{courseName ?? `Course ${courseId}`}</h1>
                        <Link to="/my-courses" className="px-4 py-2 border rounded-md text-white/80">Back to Courses</Link>
                    </div>

                    <section>
                        {loading ? (
                            <div className="text-gray-400">Loading chapters...</div>
                        ) : error ? (
                            <div className="text-red-400">Error: {error}</div>
                        ) : !chapters || chapters.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                                <p className="mb-4">No chapters found for this course.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {chapters.map((ch) => (
                                    <article key={ch.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-sm text-gray-400">Chapter {ch.number ?? "—"}</div>
                                                <h2 className="text-lg font-semibold text-white">{ch.name}</h2>
                                                <p className="text-sm text-gray-400 mt-2">{ch.description ?? ""}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Link to={`/course/${courseId}/chapter/${ch.id}`} className="px-3 py-1 bg-[#3b82f6] rounded-md text-xs text-white">Open</Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </Page>
    );
}