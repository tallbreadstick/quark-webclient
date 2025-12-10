import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { fetchLesson } from "../endpoints/LessonHandler";
import type { LessonContentResponse } from "../endpoints/LessonHandler";
import { addPage, deletePage, editPage, fetchPage, reorderPages } from "../endpoints/PageHandler";
import type { PageRequest } from "../endpoints/PageHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faGripVertical, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import PreviewRenderer from "../components/PreviewRenderer";

interface PageData {
    id: number;
    idx: number;
    renderer: "MARKDOWN" | "LATEX";
    content: string;
}

const LessonEditPage: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { userSession, setUserSession } = loadSessionState();

    const [lesson, setLesson] = useState<LessonContentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
    const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null);

    const [leftWidth, setLeftWidth] = useState<number>(320);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const [isLarge, setIsLarge] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true
    );

    const searchParams = new URLSearchParams(location.search);
    const courseIdFromQuery = searchParams.get("courseId");

    const MIN_LEFT = 200;
    const MIN_CENTER = 360;
    const MIN_PREVIEW = 360;
    const MIN_REMAIN = MIN_CENTER + MIN_PREVIEW;

    useEffect(() => {
        const onResize = () => setIsLarge(window.innerWidth >= 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (!lessonId || !userSession?.jwt) return;
        setLoading(true);
        fetchLesson(Number(lessonId), userSession.jwt).then(res => {
            if (res.ok) {
                setLesson(res.ok);
                loadPages(res.ok.pages);
                if (res.ok.pages.length > 0) {
                    setSelectedPageId(res.ok.pages[0].id);
                }
            } else {
                setError(res.err);
            }
            setLoading(false);
        });
    }, [lessonId, userSession?.jwt]);

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
            const newWidth = Math.max(MIN_LEFT, Math.min(startWidthRef.current + dx, max));
            setLeftWidth(newWidth);
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

    const loadPages = async (pagesList: { id: number; idx: number }[]) => {
        if (!userSession?.jwt) return;

        const loadedPages = await Promise.all(
            pagesList.map(async (p) => {
                const res = await fetchPage(p.id, userSession.jwt!);
                if (res.ok) {
                    return {
                        id: p.id,
                        idx: p.idx,
                        renderer: res.ok.renderer as "MARKDOWN" | "LATEX",
                        content: res.ok.content
                    };
                }
                return null;
            })
        );

        setPages(loadedPages.filter(p => p !== null) as PageData[]);
    };

    const handleBack = () => {
        if (courseIdFromQuery) {
            navigate(`/course/${courseIdFromQuery}/chapters/edit`);
            return;
        }
        navigate(-1);
    };

    const handleAddPage = async () => {
        if (!lessonId || !userSession?.jwt) return;

        const newPageRequest: PageRequest = {
            renderer: "MARKDOWN",
            content: "# New Page\n\nStart writing your content here..."
        };

        const res = await addPage(Number(lessonId), newPageRequest, userSession.jwt);
        if (res.ok) {
            const lessonRes = await fetchLesson(Number(lessonId), userSession.jwt);
            if (lessonRes.ok) {
                await loadPages(lessonRes.ok.pages);
            }
        } else {
            setError(res.err);
        }
    };

    const handleDeletePage = async (pageId: number) => {
        if (!userSession?.jwt) return;
        if (!confirm("Are you sure you want to delete this page?")) return;

        const res = await deletePage(pageId, userSession.jwt);
        if (res.ok) {
            setPages(prev => prev.filter(p => p.id !== pageId));
            if (selectedPageId === pageId) setSelectedPageId(null);
        } else {
            setError(res.err);
        }
    };

    const handleUpdatePageContent = async (pageId: number, content: string) => {
        if (!userSession?.jwt) return;

        const page = pages.find(p => p.id === pageId);
        if (!page) return;

        const pageRequest: PageRequest = {
            renderer: page.renderer,
            content
        };

        const res = await editPage(pageId, pageRequest, userSession.jwt);
        if (res.ok) {
            setPages(prev => prev.map(p => p.id === pageId ? { ...p, content } : p));
        } else {
            setError(res.err);
        }
    };

    const handleDragStart = (idx: number) => {
        setDraggedPageIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetIdx: number) => {
        if (draggedPageIdx === null || !lessonId || !userSession?.jwt) return;
        if (draggedPageIdx === targetIdx) {
            setDraggedPageIdx(null);
            return;
        }

        const reordered = [...pages];
        const [movedPage] = reordered.splice(draggedPageIdx, 1);
        reordered.splice(targetIdx, 0, movedPage);

        setPages(reordered);
        setDraggedPageIdx(null);

        const pageIds = reordered.map(p => p.id);
        const res = await reorderPages(Number(lessonId), pageIds, userSession.jwt);
        if (!res.ok) {
            setError(res.err);
            const lessonRes = await fetchLesson(Number(lessonId), userSession.jwt);
            if (lessonRes.ok) {
                await loadPages(lessonRes.ok.pages);
            }
        }
    };

    const selectedPage = pages.find(p => p.id === selectedPageId);

    return (
        <Page title={`Quark | Lesson Editor`} userSession={userSession} setUserSession={setUserSession}>
            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <div className="text-red-500 p-8">{error}</div>
            ) : !lesson ? (
                <div className="p-8">Lesson not found.</div>
            ) : (
                <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative chapter-editor">
                    <div className="absolute top-0 left-0 right-0 h-64 bg-indigo-900/20 blur-[100px] pointer-events-none" />

                    <main className="flex-1 bg-slate-950/30 backdrop-blur-sm p-8 overflow-y-auto relative custom-scrollbar">
                        <div className="max-w-[1400px] mx-auto space-y-6 animate-in zoom-in-95 duration-300 text-gray-200">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleBack}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-200 hover:bg-slate-800 hover:border-white/20 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                                    Back to Chapter Editor
                                </button>
                                <div />
                            </div>

                            <div
                                ref={containerRef}
                                className="w-full mx-auto gap-6 items-start h-full relative"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: isLarge ? `${leftWidth}px 1fr 1fr` : "1fr",
                                    gap: "1.5rem"
                                }}
                            >
                                {isLarge && (
                                    <div
                                        onMouseDown={startDrag}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: `calc(${leftWidth}px + 0.75rem - 4px)`,
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

                                <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col min-h-0">
                                    <h1 className="text-2xl font-semibold text-white mb-4">Pages</h1>

                                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                        {pages.map((page, idx) => (
                                            <div
                                                key={page.id}
                                                draggable
                                                onDragStart={() => handleDragStart(idx)}
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(idx)}
                                                onClick={() => setSelectedPageId(page.id)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedPageId === page.id
                                                        ? "bg-indigo-600/20 border-indigo-500/50"
                                                        : "bg-slate-800/50 border-white/10 hover:border-white/20"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FontAwesomeIcon icon={faGripVertical} className="w-3 h-3 text-slate-500" />
                                                    <span className="text-sm text-white flex-1">Page {idx + 1}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeletePage(page.id);
                                                        }}
                                                        className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddPage}
                                        className="w-full p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                                        Add Page
                                    </button>
                                </div>

                                {selectedPage ? (
                                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-4 h-full flex flex-col">
                                        <div className="flex-1 bg-transparent border border-white/5 rounded-md overflow-hidden min-h-0">
                                            <Editor
                                                height="100%"
                                                theme="vs-dark"
                                                language="markdown"
                                                value={selectedPage.content}
                                                onChange={(val) => handleUpdatePageContent(selectedPage.id, val ?? "")}
                                                options={{
                                                    minimap: { enabled: false },
                                                    lineNumbers: "on",
                                                    scrollBeyondLastLine: false,
                                                    wordWrap: "on",
                                                    fontSize: 14,
                                                    automaticLayout: true
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex items-center justify-center">
                                        <div className="text-center text-slate-400">
                                            <p className="mb-4">No pages yet</p>
                                            <button
                                                onClick={handleAddPage}
                                                className="px-6 py-3 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                                Add Your First Page
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedPage ? (
                                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col overflow-y-auto">
                                        <h1 className="text-2xl font-semibold text-white mb-4 text-center">Preview</h1>
                                        <div className="w-full flex-1 px-6 py-6 rounded-md bg-white border border-gray-200 text-gray-900 overflow-auto min-h-0">
                                            <div className="prose max-w-none">
                                                <PreviewRenderer value={selectedPage.content} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex items-center justify-center">
                                        <div className="text-center text-slate-400">
                                            <p>Select a page to preview</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            )}
        </Page>
    );
};

export default LessonEditPage;
