import React, { useState, Suspense, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createCourse } from "../endpoints/CourseHandler";
import Editor from "@monaco-editor/react";

// Lazy-loaded fallback LaTeX renderer (still rendered using Markdown+KaTeX)
const LatexRenderer = React.lazy(async () => ({
    default: ({ value }: { value: string }) => (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {value}
        </ReactMarkdown>
    )
}));

export default function CourseCreationPage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [introRenderer, setIntroRenderer] = useState<"MARKDOWN" | "LATEX">("MARKDOWN");
    const [introContent, setIntroContent] = useState("");
    const [leftWidth, setLeftWidth] = useState<number>(320);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const [isLarge, setIsLarge] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

    // Resize bounds: minimum left width, plus minimum center and preview widths
    const MIN_LEFT = 200;
    const MIN_CENTER = 360;
    const MIN_PREVIEW = 360;
    const MIN_REMAIN = MIN_CENTER + MIN_PREVIEW;

    const [forkable, setForkable] = useState(false);
    const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("PUBLIC");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const fd = new FormData(e.currentTarget);

        const name = String(fd.get("name") || "").trim();
        const description = String(fd.get("description") || "").trim() || null;
        const tagsRaw = String(fd.get("tags") || "").trim();

        if (!name) {
            setError("Name is required.");
            setSubmitting(false);
            return;
        }

        const introductionJson = JSON.stringify({
            renderer: introRenderer,
            content: introContent
        });

        const body: any = {
            name,
            description,
            introduction: introductionJson,
            forkable,
            visibility
        };

        if (tagsRaw) {
            const ids = tagsRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((id) => Number(id))
                .filter((n) => !isNaN(n));

            if (ids.length) body.tags = ids.map(String);
        }

        try {
            const jwt = userSession?.jwt ?? "";
            const res = await createCourse(body, jwt);

            if (res.status !== "OK") throw new Error(res.err ?? "Failed to create course");

            navigate("/my-courses");
        } catch (err: any) {
            const msg = err?.response?.data || err?.message || "Failed to create course";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const onResize = () => setIsLarge(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current || !containerRef.current) return;
            const dx = e.clientX - startXRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();
            const max = Math.max(MIN_LEFT, containerRect.width - MIN_REMAIN);
            let newWidth = Math.max(MIN_LEFT, Math.min(startWidthRef.current + dx, max));
            setLeftWidth(newWidth);
        };

        const onMouseUp = () => {
            if (draggingRef.current) {
                draggingRef.current = false;
                document.body.style.cursor = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }
        };

        // cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
        };
    }, []);

    const startDrag = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        draggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = leftWidth;
        document.body.style.cursor = 'col-resize';
        const onMouseMove = (ev: MouseEvent) => {
            if (!draggingRef.current || !containerRef.current) return;
            const dx = ev.clientX - startXRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const maxLeft = containerWidth / 4; // 1/3 of total width
            const max = Math.min(maxLeft, containerWidth - MIN_REMAIN);
            let newWidth = Math.max(MIN_LEFT, Math.min(startWidthRef.current + dx, max));
            setLeftWidth(newWidth);
        };
        const onMouseUp = () => {
            draggingRef.current = false;
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <Page title="Quark | Create Course" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 h-[calc(100vh-7rem)] px-3 py-4 text-gray-200">
                <div
                    ref={containerRef}
                    className="w-full mx-auto gap-6 items-start h-full relative"
                    style={{ display: 'grid', gridTemplateColumns: isLarge ? `${leftWidth}px 1fr 1fr` : '1fr', gap: '1.5rem' }}
                >

                    {isLarge && (
                        <div
                            onMouseDown={startDrag}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: `calc(${leftWidth}px + 0.75rem - 4px)`,
                                //   ^ sidebar width  ^ grid gap(1.5rem/2)   ^ half handle
                                height: "100%",
                                width: "8px",
                                cursor: "col-resize",
                                zIndex: 40
                            }}
                            className="hidden lg:block"
                        >
                            <div className="h-full w-full bg-transparent hover:bg-white/10 transition-colors" />
                        </div>
                    )}

                    {/* LEFT: form controls (narrow) */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
                        <div className="flex-1 overflow-hidden">
                            <h1 className="text-2xl font-semibold text-white mb-4 text-left">Create Course</h1>

                            {!userSession ? (
                                <div className="text-center text-gray-300">
                                    <p className="mb-4">You must be signed in to create a course.</p>
                                    <div className="flex justify-center gap-3">
                                        <a href="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white cursor-pointer">
                                            Sign in
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <form id="course-create-form" onSubmit={handleSubmit} className="flex flex-col gap-4 h-full overflow-auto">
                                    {error && <div className="mb-2 text-sm text-red-400">{error}</div>}

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
                                        <input
                                            name="name"
                                            required
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Description</label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text h-24 resize-y"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Tag IDs (comma separated)</label>
                                        <input
                                            name="tags"
                                            placeholder="e.g. 1,2,3"
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition cursor-text"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="inline-flex items-center gap-2 text-sm text-black-300">
                                            <input
                                                type="checkbox"
                                                checked={forkable}
                                                onChange={(e) => setForkable(e.target.checked)}
                                            />
                                            <span className="text-white">Forkable</span>
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-sm text-black-300">
                                            <div className="text-sm mr-2 text-white">Visibility</div>
                                            <select
                                                value={visibility}
                                                onChange={(e) => setVisibility(e.target.value as any)}
                                                className="px-2 py-1 bg-black text-white rounded-md border border-white/10"
                                            >
                                                <option value="PUBLIC">Public</option>
                                                <option value="PRIVATE">Private</option>
                                                <option value="UNLISTED">Unlisted</option>
                                            </select>
                                        </label>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Create button pinned to bottom of left column */}
                        {userSession && (
                            <div className="pt-4">
                                <div className="flex justify-center">
                                    <button
                                        type="submit"
                                        form="course-create-form"
                                        disabled={submitting}
                                        onClick={() => document.querySelector<HTMLFormElement>("form")?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                                        className="px-6 py-3 bg-indigo-600 rounded-md text-white font-medium cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? "Creating..." : "Create Course"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CENTER: Editor */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-300">Renderer</div>
                            <select
                                value={introRenderer}
                                onChange={(e) => setIntroRenderer(e.target.value as any)}
                                className="px-2 py-1 bg-black text-white rounded-md border border-white/10"
                            >
                                <option value="MARKDOWN">Markdown</option>
                                <option value="LATEX">LaTeX</option>
                            </select>
                        </div>

                        <div className="flex-1 bg-transparent border border-white/5 rounded-md overflow-hidden min-h-0">
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                defaultLanguage={introRenderer === "LATEX" ? "latex" : "markdown"}
                                language={introRenderer === "LATEX" ? "latex" : "markdown"}
                                value={introContent}
                                onChange={(val) => setIntroContent(val ?? "")}
                                options={{
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    fontSize: 14,
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col overflow-y-auto">
                        <h1 className="text-2xl font-semibold text-white mb-4 text-center">Preview</h1>

                        <div className="w-full flex-1 px-6 py-6 rounded-md bg-white border border-gray-200 text-gray-900 overflow-auto min-h-0">
                            <div className="markdown-preview">
                                <Suspense fallback={<div>Loading preview...</div>}>
                                    {introRenderer === "MARKDOWN" ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {introContent}
                                        </ReactMarkdown>
                                    ) : (
                                        <LatexRenderer value={introContent} />
                                    )}
                                </Suspense>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </Page>
    );
}
