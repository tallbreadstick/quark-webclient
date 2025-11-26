import React, { useEffect, useState, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { fetchCourseWithChapters, editCourse } from "../endpoints/CourseHandler";
import { fetchUsers } from "../endpoints/UserHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// lightweight lazy LaTeX renderer using Markdown+KaTeX to avoid extra deps
const LatexRenderer = React.lazy(async () => ({
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

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [introRenderer, setIntroRenderer] = useState<"MARKDOWN" | "LATEX">("MARKDOWN");
  const [introContent, setIntroContent] = useState("");
  const [forkable, setForkable] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("PUBLIC");
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      try {
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

        // confirm user profile (keeps parity with other pages)
        const lookup = userSession.username || userSession.email || "";
        const userRes = await fetchUsers(lookup);
        if (!(userRes.status === "OK" && userRes.ok && userRes.ok.length > 0)) {
          if (!cancelled) setError("User profile not found");
        }

        const res = await fetchCourseWithChapters(Number(courseId), userSession.jwt ?? "");
        if (res.status !== "OK" || !res.ok) {
          if (!cancelled) setError(res.err ?? "Failed to fetch course");
        } else {
          const course = res.ok;

          // populate fields
          setName(course.name ?? "");
          setDescription(course.description ?? null);
          setForkable(Boolean(course.forkable));
          setVisibility((course as any).visibility ?? "PUBLIC");
          setTagsText((course.tags ?? []).join(","));

          // introduction is stored as JSON string — try to parse
          try {
            const parsed = JSON.parse(course.introduction ?? '{"renderer":"MARKDOWN","content":""}');
            setIntroRenderer(parsed.renderer === "LATEX" ? "LATEX" : "MARKDOWN");
            setIntroContent(parsed.content ?? "");
          } catch (e) {
            // older courses may have plain text intro — assume MARKDOWN
            setIntroRenderer("MARKDOWN");
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
    return () => {
      cancelled = true;
    };
  }, [courseId, userSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!courseId) {
      setError("Invalid course id");
      setSubmitting(false);
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      setSubmitting(false);
      return;
    }

    const introJson = JSON.stringify({ renderer: introRenderer, content: introContent });

    const tags = (tagsText || "").split(",").map(s => s.trim()).filter(Boolean).map(String);

    const body = {
      name: name.trim(),
      description: description ? description.trim() : null,
      introduction: introJson,
      forkable,
      visibility,
      tags
    };

    try {
      const jwt = userSession?.jwt ?? "";
      const res = await editCourse(Number(courseId), body as any, jwt);
      if (res.status !== "OK") throw new Error(res.err ?? "Failed to update course");

      // Navigate to course content after edit
      navigate(`/course/${courseId}/chapters`);
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
      <div className="relative z-10 min-h-[calc(100vh-7rem)] flex items-center justify-center px-6 py-8 text-gray-200">
        <div className="max-w-3xl w-full mx-auto bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-4 text-center">Edit Course</h1>

          {error && <div className="mb-4 text-sm text-red-400 text-center">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white" />

            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Description</label>
            <input value={description ?? ""} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 mb-4 border rounded-md bg-black/20 text-white" />

            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Introduction</label>
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm text-gray-300">Renderer</div>
                <select value={introRenderer} onChange={(e) => setIntroRenderer(e.target.value as any)} className="px-2 py-1 bg-black/30 text-white rounded-md border border-white/10">
                  <option value="MARKDOWN">Markdown</option>
                  <option value="LATEX">LaTeX</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea value={introContent} onChange={(e) => setIntroContent(e.target.value)} rows={10} className="w-full px-4 py-2 rounded-md bg-black/20 text-white border" placeholder={introRenderer === "MARKDOWN" ? "Write introduction in Markdown..." : "Write LaTeX content..."} />

                <div className="w-full px-4 py-2 rounded-md bg-black/10 border text-white overflow-auto" style={{ minHeight: 160 }}>
                  <div className="text-xs text-gray-300 mb-2">Preview</div>
                  <div className="prose prose-invert text-sm">
                    <Suspense fallback={<div>Loading preview...</div>}>
                      {introRenderer === "MARKDOWN" ? (
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{introContent}</ReactMarkdown>
                      ) : (
                        <LatexRenderer value={introContent} />
                      )}
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>

            <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Tag IDs (comma separated)</label>
            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. 1,2,3" className="w-full px-4 py-2 mb-6 border rounded-md bg-black/20 text-white" />

            <div className="flex items-center gap-4 mb-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={forkable} onChange={(e) => setForkable(e.target.checked)} />
                <span>Forkable</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <div className="text-sm mr-2">Visibility</div>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="px-2 py-1 bg-black/30 text-white rounded-md border border-white/10">
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="UNLISTED">Unlisted</option>
                </select>
              </label>
            </div>

            <div className="flex justify-center">
              <button type="submit" disabled={submitting} className="px-6 py-3 bg-indigo-600 rounded-md text-white font-medium cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
}
