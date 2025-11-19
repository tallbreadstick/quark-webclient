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

export default function ChapterDetailPage() {
    const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
    const { userSession, setUserSession } = loadSessionState();
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chapterId) return;
        let cancelled = false;

        async function fetchChapter() {
            setLoading(true);
            setError(null);
            try {
                // Backend exposes GET /api/chapter/{id}
                const res = await api.get(`/chapter/${chapterId}`);
                if (!cancelled) setChapter(res.data ?? null);
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Failed to load chapter");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchChapter();
        return () => {
            cancelled = true;
        };
    }, [chapterId]);

    return (
        <Page title={`Quark | Chapter ${chapterId}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold text-white">Chapter</h1>
                        <Link to={`/course/${courseId}/chapters`} className="px-4 py-2 border rounded-md text-white/80">Back to Chapters</Link>
                    </div>

                    <section>
                        {loading ? (
                            <div className="text-gray-400">Loading chapter...</div>
                        ) : error ? (
                            <div className="text-red-400">Error: {error}</div>
                        ) : !chapter ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                                <p className="mb-4">Chapter not found.</p>
                            </div>
                        ) : (
                            <article className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm text-gray-400">Chapter {chapter.number ?? "—"}</div>
                                        <h2 className="text-lg font-semibold text-white">{chapter.name}</h2>
                                        <p className="text-sm text-gray-400 mt-2">{chapter.description ?? ""}</p>
                                    </div>
                                </div>
                            </article>
                        )}
                    </section>
                </div>
            </div>
        </Page>
    );
}
