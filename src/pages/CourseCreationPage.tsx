import React, { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createCourse } from "../endpoints/CourseHandler";

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

    return (
        <Page title="Quark | Create Course" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* LEFT: Editor (full left column) */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                        <h1 className="text-2xl font-semibold text-white mb-4 text-center">Create Course</h1>

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
                            <form onSubmit={handleSubmit}>
                                {error && <div className="mb-4 text-sm text-red-400 text-center">{error}</div>}

                                {/* NAME */}
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white"
                                />

                                {/* DESCRIPTION */}
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Description</label>
                                <input
                                    name="description"
                                    className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white"
                                />


                                {/* TAGS */}
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff]">
                                    Tag IDs (comma separated)
                                </label>
                                <input
                                    name="tags"
                                    placeholder="e.g. 1,2,3"
                                    className="w-full px-4 py-2 mb-6 border rounded-md bg-black/20 text-white"
                                />

                                {/* OPTIONS */}
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="inline-flex items-center gap-2 text-sm text-black-300">
                                        <input
                                            type="checkbox"
                                            checked={forkable}
                                            onChange={(e) => setForkable(e.target.checked)}
                                        />
                                        <span>Forkable</span>
                                    </label>

                                    <label className="inline-flex items-center gap-2 text-sm text-black-300">
                                        <div className="text-sm mr-2">Visibility</div>
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

                                {/* INTRODUCTION */}
                                <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Introduction</label>

                                <div className="mb-4">
                                    <div className="flex items-center gap-3 mb-2">
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

                                    <div className="grid grid-cols-1 gap-4">
                                        <textarea
                                            name="introduction"
                                            value={introContent}
                                            onChange={(e) => setIntroContent(e.target.value)}
                                            rows={10}
                                            className="w-full px-4 py-2 rounded-md bg-black/20 text-white border"
                                            placeholder={
                                                introRenderer === "MARKDOWN"
                                                    ? "Write introduction in Markdown..."
                                                    : "Write LaTeX content..."
                                            }
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT */}
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

                    {/* RIGHT: Preview (full right column) */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                        <h1 className="text-2xl font-semibold text-white mb-4 text-center">Course Introduction Preview</h1>

                        <div className="w-full px-4 py-2 rounded-md bg-black/10 border text-white overflow-auto" style={{ minHeight: 160 }}>
                            <div className="text-xs text-gray-300 mb-2">Preview</div>

                            <div className="prose prose-invert text-sm">
                                <Suspense fallback={<div>Loading preview...</div>}>
                                    {introRenderer === "MARKDOWN" ? (
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
