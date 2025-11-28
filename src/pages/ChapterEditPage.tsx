import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import {
    fetchCourseWithChapters,
} from "../endpoints/CourseHandler";
import {
    editChapter,
    addChapter,
    deleteChapter,
    type ChapterRequest,
    type ChapterContentResponse,
    type ChapterItem
} from "../endpoints/ChapterHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function ChapterEditPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { userSession } = loadSessionState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chapters, setChapters] = useState<ChapterContentResponse[]>([]);

    // For adding/editing chapter
    const [editingChapter, setEditingChapter] = useState<ChapterContentResponse | null>(null);
    const [chapterName, setChapterName] = useState("");
    const [chapterDesc, setChapterDesc] = useState("");
    const [chapterIcon, setChapterIcon] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Load course + chapters
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);

            if (!userSession) {
                setError("You must be signed in to edit chapters.");
                setLoading(false);
                return;
            }

            if (!courseId) {
                setError("Invalid course id");
                setLoading(false);
                return;
            }

            try {
                const res = await fetchCourseWithChapters(Number(courseId), userSession.jwt ?? "");
                if (res.status !== "OK" || !res.ok) {
                    if (!cancelled) setError(res.err ?? "Failed to fetch course chapters");
                } else {
                    if (!cancelled) setChapters(res.ok.chapters.map(ch => ({ ...ch, items: [] })) || []);
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load chapters");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [courseId, userSession]);

    const startEditChapter = (chapter: ChapterContentResponse) => {
        setEditingChapter(chapter);
        setChapterName(chapter.name);
        setChapterDesc(chapter.description);
        setChapterIcon(chapter.icon);
    };

    const clearForm = () => {
        setEditingChapter(null);
        setChapterName("");
        setChapterDesc("");
        setChapterIcon("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChapter) return;

        setSubmitting(true);
        setError(null);

        const body: ChapterRequest = {
            name: chapterName,
            description: chapterDesc,
            icon: chapterIcon
        };

        try {
            const res = await editChapter(editingChapter.id, body, userSession?.jwt ?? "");
            if (res.status !== "OK") throw new Error(res.err ?? "Failed to save chapter");

            // Update local state
            setChapters((prev) =>
                prev.map((ch) => ch.id === editingChapter.id ? { ...ch, ...body } : ch)
            );
            clearForm();
        } catch (e: any) {
            setError(e?.message ?? "Failed to save chapter");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <Page title="Quark | Edit Chapters" userSession={userSession} setUserSession={() => {}}>
            <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
                <LoadingSkeleton count={3} />
            </div>
        </Page>
    );

    return (
        <Page title="Quark | Edit Chapters" userSession={userSession} setUserSession={() => {}}>
            <div className="px-4 py-6">
                {error && <div className="mb-4 text-red-400">{error}</div>}

                <h1 className="text-2xl font-semibold text-white mb-4">Chapters</h1>

                <div className="mb-6 space-y-2">
                    {chapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-center justify-between bg-black/20 p-3 rounded-md border border-white/10">
                            <div>
                                <div className="text-white font-medium">{chapter.idx}. {chapter.name}</div>
                                <div className="text-gray-300 text-sm">{chapter.description}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                                    onClick={() => startEditChapter(chapter)}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {editingChapter && (
                    <form onSubmit={handleSubmit} className="space-y-4 bg-black/20 p-4 rounded-md border border-white/10">
                        <h2 className="text-xl font-semibold text-white">Edit Chapter</h2>
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Name</label>
                            <input
                                value={chapterName}
                                onChange={(e) => setChapterName(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Description</label>
                            <textarea
                                value={chapterDesc}
                                onChange={(e) => setChapterDesc(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-1">Icon</label>
                            <input
                                value={chapterIcon}
                                onChange={(e) => setChapterIcon(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={clearForm}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Page>
    );
}
