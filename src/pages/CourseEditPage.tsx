import React, { useEffect, useState, Suspense, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { fetchCourseWithChapters, editCourse } from "../endpoints/CourseHandler";
import { fetchUsers } from "../endpoints/UserHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Lazy Markdown+KaTeX renderer
const PreviewRenderer = React.lazy(async () => ({
    default: ({ value }: { value: string }) => (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {value}
        </ReactMarkdown>
    ),
}));

export default function CourseEditPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { userSession, setUserSession } = loadSessionState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState<string | null>(null);
    const [introContent, setIntroContent] = useState("");

    const [forkable, setForkable] = useState(false);
    const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("PUBLIC");
    const [tagsText, setTagsText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // drag & layout state
    const [leftWidth, setLeftWidth] = useState<number>(320);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const [isLarge, setIsLarge] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true
    );

    const MIN_LEFT = 200;
    const MIN_CENTER = 360;
    const MIN_PREVIEW = 360;
    const MIN_REMAIN = MIN_CENTER + MIN_PREVIEW;

    // Load course data
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            if (!userSession) {
                setError("You must be signed in to edit courses.");
                setLoading(false);
                return;
            }
            if (!courseId) {
                setError("Invalid course id");
                setLoading(false);
                return;
            }

            try {
                const lookup = userSession.username || userSession.email || "";
                const userRes = await fetchUsers(lookup);
                if (!(userRes.status === "OK" && userRes.ok?.length)) {
                    if (!cancelled) setError("User profile not found");
                }

                const res = await fetchCourseWithChapters(Number(courseId), userSession.jwt ?? "");
                if (res.status !== "OK" || !res.ok) {
                    if (!cancelled) setError(res.err ?? "Failed to fetch course");
                } else {
                    const course = res.ok;
                    setName(course.name ?? "");
                    setDescription(course.description ?? null);
                    setForkable(Boolean(course.forkable));
                    setVisibility((course as any).visibility ?? "PUBLIC");
                    setTagsText((course.tags ?? []).join(","));
                    try {
                        const parsed = JSON.parse(course.introduction ?? '{"content":""}');
                        setIntroContent(parsed.content ?? "");
                    } catch {
                        setIntroContent(String(course.introduction ?? ""));
                    }
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "Failed to load course");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [courseId, userSession]);

    // Responsive
    useEffect(() => {
        const onResize = () => setIsLarge(window.innerWidth >= 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Drag handler
    const startDrag = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        draggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = leftWidth;
        document.body.style.cursor = "col-resize";

        const onMouseMove = (ev: MouseEvent) => {
            if (!draggingRef.current || !containerRef.current) return;
            const dx = ev.clientX - startXRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();
            const maxLeft = containerRect.width / 4;
            const max = Math.min(maxLeft, containerRect.width - MIN_REMAIN);
            setLeftWidth(Math.max(MIN_LEFT, Math.min(startWidthRef.current + dx, max)));
        };

        const onMouseUp = () => {
            draggingRef.current = false;
            document.body.style.cursor = "";
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    useEffect(() => {
        const clamp = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const max = Math.max(MIN_LEFT, rect.width - MIN_REMAIN);
            setLeftWidth((w) => Math.max(MIN_LEFT, Math.min(w, max)));
        };
        window.addEventListener("resize", clamp);
        clamp();
        return () => window.removeEventListener("resize", clamp);
    }, []);

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!courseId || !name.trim()) {
            setError(!courseId ? "Invalid course id" : "Name is required");
            setSubmitting(false);
            return;
        }

        const introJson = JSON.stringify({ content: introContent });
        const tags = (tagsText || "").split(",").map(s => s.trim()).filter(Boolean).map(String);
        const body = { name: name.trim(), description: description?.trim() ?? null, introduction: introJson, forkable, visibility, tags };

        try {
            const jwt = userSession?.jwt ?? "";
            const res = await editCourse(Number(courseId), body as any, jwt);
            if (res.status !== "OK") throw new Error(res.err ?? "Failed to update course");

            // saving does not redirect anymore (yall can change ts)
            // navigate(`/course/${courseId}/chapters`);
        } catch (e: any) {
            setError(e?.message || "Failed to save");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <Page title="Quark | Edit Course" userSession={userSession} setUserSession={setUserSession}>
            <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
                <LoadingSkeleton count={3} />
            </div>
        </Page>
    );

    return (
        <Page title={`Quark | Edit ${name || "Course"}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 h-[calc(100vh-7rem)] px-3 py-4 text-gray-200">
                <div ref={containerRef} className="w-full mx-auto gap-6 items-start h-full relative"
                    style={{ display: 'grid', gridTemplateColumns: isLarge ? `${leftWidth}px 1fr 1fr` : '1fr', gap: '1.5rem' }}>

                    {/* Drag handle */}
                    {isLarge && (
                        <div onMouseDown={startDrag} style={{
                            position: 'absolute', top: 0, left: `calc(${leftWidth}px + 0.75rem - 4px)`,
                            height: "100%", width: 8, cursor: 'col-resize', zIndex: 40
                        }}>
                            <div className="h-full w-full bg-transparent hover:bg-white/10" />
                        </div>
                    )}

                    {/* LEFT: Form + buttons */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
                        <div className="flex-1 overflow-auto">
                            <h1 className="text-2xl font-semibold text-white mb-4 text-left">Edit Course</h1>
                            {!userSession ? (
                                <div className="text-center text-gray-300">
                                    <p className="mb-4">You must be signed in to edit a course.</p>
                                    <a href="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white cursor-pointer">Sign in</a>
                                </div>
                            ) : (
                                <form id="course-edit-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    {error && <div className="mb-2 text-sm text-red-400">{error}</div>}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
                                        <input value={name} onChange={(e) => setName(e.target.value)} required
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition" />
                                        <label className="block mb-2 mt-3 text-sm font-medium text-[#bdcdff]">Description</label>
                                        <textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={4}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition h-24 resize-y" />
                                        <label className="block mb-2 mt-3 text-sm font-medium text-[#bdcdff]">Tag IDs (comma separated)</label>
                                        <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. 1,2,3"
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition" />
                                        <div className="mt-2 flex items-center gap-4">
                                            <label className="inline-flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={forkable} onChange={(e) => setForkable(e.target.checked)} />
                                                <span className="text-white">Forkable</span>
                                            </label>
                                            <div className="ml-auto text-sm text-white flex items-center gap-2">
                                                Visibility:
                                                <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)}
                                                    className="px-2 py-1 bg-black text-white rounded-md border border-white/10">
                                                    <option value="PUBLIC">Public</option>
                                                    <option value="PRIVATE">Private</option>
                                                    <option value="UNLISTED">Unlisted</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                        {userSession && (
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/course/${courseId}/chapters/edit`)}
                                    className="flex-1 px-4 py-2 bg-gray-700 rounded-md text-white text-sm font-medium hover:bg-gray-600"
                                >
                                    Edit Chapters
                                </button>
                                <button
                                    type="submit"
                                    form="course-edit-form"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 rounded-md text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CENTER: Editor */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-4 h-full flex flex-col">
                        <div className="flex-1 bg-transparent border border-white/5 rounded-md overflow-hidden">
                            <Editor
                                height="100%"
                                language="markdown"
                                theme="vs-dark"
                                value={introContent}
                                onChange={(val) => setIntroContent(val ?? "")}
                                options={{
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    fontSize: 14,
                                    automaticLayout: true
                                }}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col overflow-y-auto">
                        <h1 className="text-2xl font-semibold text-white mb-4 text-center">Preview</h1>
                        <div className="w-full flex-1 px-6 py-6 rounded-md bg-white border border-gray-200 text-gray-900 overflow-auto min-h-0 prose">
                            <Suspense fallback={<div>Loading preview...</div>}>
                                <PreviewRenderer value={introContent} />
                            </Suspense>
                        </div>
                    </div>

                </div>
            </div>
        </Page>
    );
}
