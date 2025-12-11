import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faPencil } from "@fortawesome/free-solid-svg-icons";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import type { Chapter, Course, Item, PageContent, ItemSection } from "../types/CourseContentTypes";
import api from "../scripts/api";

// Lazy Markdown+KaTeX renderer
const PreviewRenderer = React.lazy(async () => ({
    default: ({ value }: { value: string }) => (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {value}
        </ReactMarkdown>
    ),
}));

// Fetch course, chapters, lessons (pages), and activities (sections) using the available API shapes.
async function fetchCourseOutline(courseId: number): Promise<{ course: Course | null; chapters: Chapter[] }> {
    const courseRes = await api.get(`/courses/${courseId}`);
    const courseData = courseRes?.data ?? null;
    const chaptersMeta = Array.isArray(courseRes?.data?.chapters) ? courseRes.data.chapters : [];

    const chapters: Chapter[] = await Promise.all(
        chaptersMeta.map(async (chapter: any, metaIndex: number) => {
            try {
                const chRes = await api.get(`/chapter/${chapter.id}`);
                const chData = chRes?.data;
                const itemsRaw = Array.isArray(chData?.items) ? chData.items : [];

                const items: Item[] = await Promise.all(
                    itemsRaw.map(async (it: any, itemIdx: number) => {
                        const base: Item = {
                            id: it.id,
                            name: it.name,
                            description: it.description ?? null,
                            icon: it.icon ?? null,
                            number: it.idx ?? itemIdx + 1,
                            type: it.itemType === "ACTIVITY" ? "ACTIVITY" : "LESSON",
                            finishMessage: it.finishMessage ?? null,
                            ruleset: it.ruleset ?? null,
                            pages: [],
                            sections: [],
                        };

                        if (base.type === "LESSON") {
                            try {
                                const lessonRes = await api.get(`/lesson/${it.id}`);
                                const lessonData = lessonRes?.data;
                                const lessonPages = Array.isArray(lessonData?.pages) ? lessonData.pages : [];

                                const pages: PageContent[] = await Promise.all(
                                    lessonPages.map(async (p: any) => {
                                        try {
                                            const pageRes = await api.get(`/page/${p.id}`);
                                            const pageData = pageRes?.data ?? {};
                                            return {
                                                id: p.id,
                                                number: p.idx ?? p.number,
                                                content: pageData.content ?? null,
                                                renderer: pageData.renderer ?? null,
                                            };
                                        } catch {
                                            return { id: p.id, number: p.idx ?? p.number, content: null, renderer: null };
                                        }
                                    })
                                );

                                return { ...base, pages, finishMessage: lessonData?.finishMessage ?? base.finishMessage };
                            } catch (e) {
                                console.warn("Failed to fetch lesson", it.id, e);
                                return base;
                            }
                        }

                        try {
                            const actRes = await api.get(`/activity/${it.id}`);
                            const actData = actRes?.data;
                            const sectionsRaw = Array.isArray(actData?.sections) ? actData.sections : [];

                            const sections: ItemSection[] = await Promise.all(
                                sectionsRaw.map(async (s: any) => {
                                    try {
                                        const sectionRes = await api.get(`/section/${s.id}`);
                                        const sectionData = sectionRes?.data ?? {};
                                        return {
                                            id: s.id,
                                            idx: s.idx ?? sectionData.idx,
                                            sectionType: sectionData.sectionType ?? sectionData.type ?? s.sectionType,
                                        };
                                    } catch {
                                        return { id: s.id, idx: s.idx, sectionType: s.sectionType };
                                    }
                                })
                            );

                            return {
                                ...base,
                                sections,
                                ruleset: actData?.ruleset ? JSON.stringify(actData.ruleset) : base.ruleset,
                                finishMessage: actData?.finishMessage ?? base.finishMessage,
                            };
                        } catch (e) {
                            console.warn("Failed to fetch activity", it.id, e);
                            return base;
                        }
                    })
                );

                return {
                    id: chapter.id,
                    name: chapter.name,
                    description: chapter.description ?? chData?.description ?? null,
                    icon: chapter.icon ?? chData?.icon ?? null,
                    number: chapter.idx ?? metaIndex + 1,
                    items,
                };
            } catch (e) {
                console.warn("Failed to fetch chapter", chapter.id, e);
                return {
                    id: chapter.id,
                    name: chapter.name,
                    description: chapter.description ?? null,
                    icon: chapter.icon ?? null,
                    number: chapter.idx ?? metaIndex + 1,
                    items: [],
                };
            }
        })
    );

    return { course: courseData, chapters };
}

export default function CourseContent() {
    const { courseId } = useParams<{ courseId: string }>();
    const { userSession, setUserSession } = loadSessionState();

    const [course, setCourse] = useState<Course | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<{ chapterIdx: number; itemIdx: number } | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError(null);
            try {
                const { course: courseData, chapters: chaptersData } = await fetchCourseOutline(Number(courseId));
                
                if (cancelled) return;

                setCourse(courseData);
                setChapters(chaptersData);

                // Auto-select first item if available
                if (chaptersData.length > 0 && chaptersData[0].items && chaptersData[0].items.length > 0) {
                    setSelectedItem({ chapterIdx: 0, itemIdx: 0 });
                }
            } catch (err: any) {
                if (!cancelled) {
                    const status = err?.response?.status;
                    if (status === 401 || status === 403) {
                        setError("Unauthorized — please sign in to view this course.");
                    } else {
                        setError(err?.message || "Failed to load course content");
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadAll();
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    const courseTitle = course?.name ?? `Course ${courseId ?? ""}`;
    const currentItem = selectedItem ? chapters[selectedItem.chapterIdx]?.items?.[selectedItem.itemIdx] : null;

    // Reset page index when item changes
    useEffect(() => {
        setCurrentPageIndex(0);
    }, [selectedItem]);

    const renderContent = () => {
        if (!currentItem) {
            return (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Select a lesson or activity to begin</p>
                </div>
            );
        }

        if (currentItem.type === "LESSON") {
            const pages = currentItem.pages || [];
            const totalPages = pages.length;
            const currentPage = pages[currentPageIndex];

            if (totalPages === 0) {
                return <p className="text-gray-400">No content available for this lesson.</p>;
            }

            return (
                <>
                    {currentPage && (
                        <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                            <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-code:text-blue-300 prose-li:text-gray-200">
                                {currentPage.content ? (
                                    <Suspense fallback={<div className="text-gray-400">Loading content...</div>}>
                                        <PreviewRenderer value={currentPage.content} />
                                    </Suspense>
                                ) : (
                                    <p className="text-gray-400">No content available for this page.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                            <button
                                onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentPageIndex === 0}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                ← Previous
                            </button>
                            
                            <div className="text-sm text-gray-400">
                                Page {currentPageIndex + 1} of {totalPages}
                            </div>
                            
                            <button
                                onClick={() => setCurrentPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPageIndex === totalPages - 1}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            );
        }

        if (currentItem.type === "ACTIVITY") {
            return (
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Activity Questions</h3>
                        {currentItem.sections && currentItem.sections.length > 0 ? (
                            <div className="space-y-4">
                                {currentItem.sections.map((section, idx) => (
                                    <div key={section.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                        <div className="text-sm text-gray-400 mb-2">
                                            Section {idx + 1} • {section.sectionType || "Unknown"}
                                        </div>
                                        <div className="text-gray-300">
                                            <p>Section ID: {section.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No sections available for this activity.</p>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <Page title={`Quark | ${courseTitle}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 h-[calc(100vh-7rem)] flex">
                {/* Sidebar */}
                <aside className="w-80 border-r border-white/10 bg-white/5 overflow-y-auto h-full flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white mb-2">{courseTitle}</h2>
                        {course?.description && (
                            <p className="text-sm text-gray-400">{course.description}</p>
                        )}
                    </div>

                    {loading && (
                        <div className="p-6 text-center text-gray-400">
                            <p>Loading...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 text-center text-red-400">
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && chapters.length === 0 && (
                        <div className="p-6 text-center text-gray-400">
                            <p>No chapters yet.</p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {!loading && !error && chapters.map((chapter, chapterIdx) => (
                        <div key={chapter.id} className="border-b border-white/10">
                            <div className="px-6 py-4 bg-white/3">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                                    {chapter.name}
                                </h3>
                                
                                {chapter.description && (
                                    <p className="text-xs text-gray-400 mt-1">{chapter.description}</p>
                                )}
                            </div>
                            <div className="py-2">
                                {chapter.items && chapter.items.length > 0 ? (
                                    chapter.items.map((item, itemIdx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem({ chapterIdx, itemIdx })}
                                            className={`w-full text-left px-6 py-3 hover:bg-white/10 transition ${
                                                selectedItem?.chapterIdx === chapterIdx && selectedItem?.itemIdx === itemIdx
                                                    ? "bg-white/10 border-l-4 border-blue-500"
                                                    : "border-l-4 border-transparent"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: item.type === "LESSON" ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                                                    <FontAwesomeIcon 
                                                        icon={item.type === "LESSON" ? faBook : faPencil} 
                                                        className={item.type === "LESSON" ? "text-blue-400" : "text-green-400"}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white">{item.name}</div>
                                                    {item.description && (
                                                        <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        {item.type === "LESSON" && (
                                                            <span>{item.pages?.length ?? 0} pages</span>
                                                        )}
                                                        {item.type === "ACTIVITY" && (
                                                            <span>{item.sections?.length ?? 0} questions</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-6 py-3 text-sm text-gray-400">No items in this chapter</div>
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">Loading content...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto px-8 py-12">
                            {currentItem && (
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold text-white mb-4">{currentItem.name}</h1>
                                    {currentItem.description && (
                                        <p className="text-lg text-gray-300 mb-6">{currentItem.description}</p>
                                    )}
                                </div>
                            )}
                            
                            <div className="text-gray-200">
                                {renderContent()}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </Page>
    );
}