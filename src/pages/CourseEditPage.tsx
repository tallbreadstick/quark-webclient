import React, { useEffect, useState, Suspense, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { fetchCourseWithChapters, editCourse } from "../endpoints/CourseHandler";
import { fetchUsers } from "../endpoints/UserHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Editor from "@monaco-editor/react";

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

  const [ownerName, setOwnerName] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [introRenderer, setIntroRenderer] = useState<"MARKDOWN" | "LATEX">("MARKDOWN");
  const [introContent, setIntroContent] = useState("");
  // Resizable left panel state
  const [leftWidth, setLeftWidth] = useState<number>(320);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [isLarge, setIsLarge] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Minimums to prevent editor/preview from collapsing
  const MIN_LEFT = 200;
  const MIN_CENTER = 360;
  const MIN_PREVIEW = 360;
  const MIN_REMAIN = MIN_CENTER + MIN_PREVIEW;
  const [activeTab, setActiveTab] = useState<"METADATA" | "CHAPTERS">("METADATA");
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
          setOwnerName((course as any).owner ?? null);

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

  // Responsive tracking for large screens
  useEffect(() => {
    const onResize = () => setIsLarge(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mousemove cleanup effect (ensures handlers removed on unmount)
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
      const max = Math.max(MIN_LEFT, containerRect.width - MIN_REMAIN);
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

  // Clamp leftWidth on window/container resize so panels never collapse
  useEffect(() => {
    const clampToBounds = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const max = Math.max(MIN_LEFT, rect.width - MIN_REMAIN);
      setLeftWidth((w) => Math.max(MIN_LEFT, Math.min(w, max)));
    };

    window.addEventListener('resize', clampToBounds);
    clampToBounds();
    return () => window.removeEventListener('resize', clampToBounds);
  }, []);

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
      <div className="relative z-10 h-[calc(100vh-7rem)] px-3 py-4 text-gray-200">
        <div
          ref={containerRef}
          className="w-full mx-auto gap-6 items-start h-full relative"
          style={{ display: 'grid', gridTemplateColumns: isLarge ? `${leftWidth}px 1fr 1fr` : '1fr', gap: '1.5rem' }}
        >

          {isLarge && (
            <div
              onMouseDown={startDrag}
              style={{ position: 'absolute', top: 0, left: leftWidth, height: '100%', width: 8, transform: 'translateX(-4px)', cursor: 'col-resize', zIndex: 40 }}
              className="hidden lg:block"
            >
              <div className="h-full w-full bg-transparent hover:bg-white/10" />
            </div>
          )}
          {/* i forgor what the tabs were so i just put ts */}
          {/* LEFT: Metadata / Tabs (narrow) */}
          <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
            <div className="flex-1 overflow-hidden">
              <h1 className="text-2xl font-semibold text-white mb-4 text-left">Edit Course</h1>

              {!userSession ? (
                <div className="text-center text-gray-300">
                  <p className="mb-4">You must be signed in to edit a course.</p>
                  <div className="flex justify-center gap-3">
                    <a href="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white cursor-pointer">Sign in</a>
                  </div>
                </div>
              ) : (
                <form id="course-edit-form" onSubmit={handleSubmit} className="flex flex-col gap-4 h-full overflow-auto">
                  {error && <div className="mb-2 text-sm text-red-400">{error}</div>}

                  <div className="mb-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setActiveTab("METADATA")} className={`px-3 py-1 rounded-md ${activeTab === "METADATA" ? "bg-indigo-600 text-white" : "bg-white/5 text-white"}`}>
                        Metadata
                      </button>
                      <button type="button" onClick={() => setActiveTab("CHAPTERS")} className={`px-3 py-1 rounded-md ${activeTab === "CHAPTERS" ? "bg-indigo-600 text-white" : "bg-white/5 text-white"}`}>
                        Chapter Edit
                      </button>
                    </div>
                  </div>

                  {activeTab === "METADATA" ? (
                    <>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition" />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Description</label>
                        <textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition h-24 resize-y" />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Tag IDs (comma separated)</label>
                        <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. 1,2,3" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition" />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-sm text-black-300">
                          <input type="checkbox" checked={forkable} onChange={(e) => setForkable(e.target.checked)} />
                          <span className="text-white">Forkable</span>
                        </label>

                        <label className="inline-flex items-center gap-2 text-sm text-black-300">
                          <div className="text-sm mr-2 text-white">Visibility</div>
                          <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="px-2 py-1 bg-black text-white rounded-md border border-white/10">
                            <option value="PUBLIC">Public</option>
                            <option value="PRIVATE">Private</option>
                            <option value="UNLISTED">Unlisted</option>
                          </select>
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-300">Chapter editor is empty for now.</div>
                  )}
                </form>
              )}
            </div>

            {userSession && (
              <div className="pt-4">
                <div className="flex justify-center">
                  <button type="submit" form="course-edit-form" disabled={submitting} onClick={() => document.querySelector<HTMLFormElement>("#course-edit-form")?.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))} className="px-6 py-3 bg-indigo-600 rounded-md text-white font-medium cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CENTER: Editor */}
          <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300">Renderer</div>
              <div>
                <select value={introRenderer} onChange={(e) => setIntroRenderer(e.target.value as any)} className="px-2 py-1 bg-black text-white rounded-md border border-white/10">
                  <option value="MARKDOWN">Markdown</option>
                  <option value="LATEX">LaTeX</option>
                </select>
              </div>
            </div>

            <div className="flex-1 bg-transparent border border-white/5 rounded-md overflow-hidden">
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

            <div className="w-full px-6 py-6 rounded-md bg-white border border-gray-200 text-gray-900 overflow-auto h-full" style={{ minHeight: 0 }}>
              <div className="prose max-w-none">
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
