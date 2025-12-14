import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faPencil, faCheckCircle, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import type { Chapter, Course, Item, PageContent, ItemSection } from "../types/CourseContentTypes";
import { fetchCourseWithChapters } from "../endpoints/CourseHandler";
import { fetchChapterWithItems } from "../endpoints/ChapterHandler";
import { fetchLesson } from "../endpoints/LessonHandler";
import { fetchPage } from "../endpoints/PageHandler";
import { fetchActivity } from "../endpoints/ActivityHandler";
import { fetchSection } from "../endpoints/SectionHandler";
import ActivityCodeLayout from "../components/ActivityCodeLayout";
import ActivityMcqSection from "../components/ActivityMcqSection";

// Lazy Markdown+KaTeX renderer
const PreviewRenderer = React.lazy(async () => ({
    default: ({ value }: { value: string }) => (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {value}
        </ReactMarkdown>
    ),
}));

// Fetch course, chapters, lessons (pages), and activities (sections) using the API handlers
async function fetchCourseOutline(courseId: number, jwt: string): Promise<{ course: Course | null; chapters: Chapter[] }> {
    try {
        // Fetch course with chapters metadata
        const courseRes = await fetchCourseWithChapters(courseId, jwt);
        if (!courseRes.ok) {
            throw new Error(courseRes.err ?? "Failed to fetch course");
        }

        const courseData = courseRes.ok;
        const chaptersMeta = courseData.chapters || [];

        const chapters: Chapter[] = await Promise.all(
            chaptersMeta.map(async (chapter: any, metaIndex: number) => {
                try {
                    // Fetch chapter with items
                    const chRes = await fetchChapterWithItems(chapter.id, jwt);
                    if (!chRes.ok) {
                        throw new Error(chRes.err ?? "Failed to fetch chapter");
                    }

                    const chData = chRes.ok;
                    const itemsRaw = chData.items || [];

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
                                    // Fetch lesson details
                                    const lessonRes = await fetchLesson(it.id, jwt);
                                    if (!lessonRes.ok) {
                                        throw new Error(lessonRes.err ?? "Failed to fetch lesson");
                                    }

                                    const lessonData = lessonRes.ok;
                                    const lessonPages = lessonData.pages || [];

                                    const pages: PageContent[] = await Promise.all(
                                        lessonPages.map(async (p: any) => {
                                            try {
                                                const pageRes = await fetchPage(p.id, jwt);
                                                if (!pageRes.ok) {
                                                    return { id: p.id, number: p.idx, content: null, renderer: null };
                                                }
                                                const pageData = pageRes.ok;
                                                return {
                                                    id: p.id,
                                                    number: p.idx,
                                                    content: pageData.content ?? null,
                                                    renderer: pageData.renderer ?? null,
                                                };
                                            } catch {
                                                return { id: p.id, number: p.idx, content: null, renderer: null };
                                            }
                                        })
                                    );

                                    return { ...base, pages, finishMessage: lessonData.finishMessage ?? base.finishMessage };
                                } catch (e) {
                                    console.warn("Failed to fetch lesson", it.id, e);
                                    return base;
                                }
                            }

                            try {
                                // Fetch activity details
                                const actRes = await fetchActivity(it.id, jwt);
                                if (!actRes.ok) {
                                    throw new Error(actRes.err ?? "Failed to fetch activity");
                                }

                                const actData = actRes.ok;
                                const sectionsRaw = actData.sections || [];

                                const sections: ItemSection[] = await Promise.all(
                                    sectionsRaw.map(async (s: any) => {
                                        try {
                                            const sectionRes = await fetchSection(s.id, jwt);
                                            if (!sectionRes.ok) {
                                                return { id: s.id, idx: s.idx, sectionType: "MCQ" as const };
                                            }
                                            const sectionData = sectionRes.ok;
                                            return {
                                                id: s.id,
                                                idx: s.idx,
                                                sectionType: sectionData.sectionType,
                                                mcq: sectionData.mcq,
                                                code: sectionData.code,
                                            };
                                        } catch {
                                            return { id: s.id, idx: s.idx, sectionType: "MCQ" as const };
                                        }
                                    })
                                );

                                return {
                                    ...base,
                                    sections,
                                    ruleset: actData.ruleset ? JSON.stringify(actData.ruleset) : base.ruleset,
                                    finishMessage: actData.finishMessage ?? base.finishMessage,
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
                        description: chapter.description ?? chData.description ?? null,
                        icon: chapter.icon ?? chData.icon ?? null,
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
    } catch (e) {
        console.error("Failed to fetch course outline:", e);
        return { course: null, chapters: [] };
    }
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
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [codeValue, setCodeValue] = useState("");
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [testResults, setTestResults] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'intro' | { chapterIdx: number; itemIdx: number }>('intro');
    const [isRunning, setIsRunning] = useState(false);
    
    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError(null);
            try {
                const { course: courseData, chapters: chaptersData } = await fetchCourseOutline(
                    Number(courseId),
                    userSession?.jwt ?? ""
                );
                
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
    }, [courseId, userSession?.jwt]);

    const courseTitle = course?.name ?? `Course ${courseId ?? ""}`;
    const currentItem = activeTab !== 'intro' && activeTab ? chapters[activeTab.chapterIdx]?.items?.[activeTab.itemIdx] : null;
    const currentSection = currentItem?.sections?.[currentSectionIndex] ?? null;
    const totalSections = currentItem?.sections?.length ?? 0;

    // Reset page/section index when item changes
    useEffect(() => {
        setCurrentPageIndex(0);
        setCurrentSectionIndex(0);
        setCodeValue("");
        setTestResults(null);
        setSelectedTestCase(0);
    }, [activeTab]);

    // Update code editor when section changes
    useEffect(() => {
        const currentSection = activeTab !== 'intro' && activeTab ? chapters[activeTab.chapterIdx]?.items?.[activeTab.itemIdx]?.sections?.[currentSectionIndex] : null;
        if (currentSection?.sectionType === "CODE" && currentSection.code?.defaultCode) {
            setCodeValue(currentSection.code.defaultCode);
        } else {
            setCodeValue("");
        }
        setTestResults(null);
        setSelectedTestCase(0);
    }, [currentSectionIndex, activeTab, chapters]);

    /**
     *  HANDLES RUN, STILL SIMULATED FOR NOW
     */
    const handleRunCode = () => {
        setIsRunning(true);
        // Simulate code execution
        setTimeout(() => {
            setTestResults("Test case passed!\nExpected output matches actual output.");
            setIsRunning(false);
        }, 1000);
    };
    
    /**
     *  HANDLES SUBMIT, STILL SIMULATED FOR NOW
     */
    const handleSubmitCode = () => {
        setIsRunning(true);
        // Simulate code submission
        setTimeout(() => {
            setTestResults("All test cases passed!\nSubmission accepted.");
            setIsRunning(false);
        }, 1500);
    };

    // Helper to parse introduction JSON and get markdown content
    function getIntroMarkdown(course: Course | null): string | null {
        if (!course) return null;
        if (course.introduction) {
            try {
                const parsed = JSON.parse(course.introduction);
                if (typeof parsed === 'object' && parsed && typeof parsed.content === 'string') {
                    return parsed.content;
                }
                return String(course.introduction);
            } catch {
                return String(course.introduction);
            }
        }
        return course.description ?? null;
    }

    const renderContent = () => {
        if (activeTab === 'intro') {
            const introMarkdown = getIntroMarkdown(course);
            return (
                <div className="space-y-6">
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-code:text-blue-300 prose-li:text-gray-200">
                            {introMarkdown ? (
                                <Suspense fallback={<div className="text-gray-400">Loading introduction...</div>}>
                                    <PreviewRenderer value={introMarkdown} />
                                </Suspense>
                            ) : (
                                <p className="text-gray-400">No introduction available for this course.</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        
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

            const isLastPage = currentPageIndex === totalPages - 1;
            const finishMessage = isLastPage ? currentItem.finishMessage : null;

            return (
                currentPage && (
                    <div className="space-y-6">
                        <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6">
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
                        {finishMessage && (
                            <div className="bg-green-500/10 border border-green-500/30 backdrop-blur-sm rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500/20">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-400 mb-2">Lesson Complete!</h3>
                                        <p className="text-gray-300">Great job! You’ve completed this lesson.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            );
        }

        if (currentItem.type === "ACTIVITY") {
            const sections = currentItem.sections || [];
            const totalSections = sections.length;
            const currentSection = sections[currentSectionIndex];

            if (totalSections === 0) {
                return <p className="text-gray-400">No sections available for this activity.</p>;
            }

            const isLastSection = currentSectionIndex === totalSections - 1;
            const finishMessage = isLastSection ? currentItem.finishMessage : null;

            return (
                <div className="space-y-6">
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">
                                Section {currentSectionIndex + 1} of {totalSections}
                            </h3>
                            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400">
                                {currentSection?.sectionType || "Unknown"}
                            </span>
                        </div>

                        {currentSection?.sectionType === "MCQ" && currentSection.mcq && (
                            <ActivityMcqSection item={currentItem} section={currentSection} PreviewRenderer={PreviewRenderer} />
                        )}

                        {!currentSection?.mcq && !currentSection?.code && (
                            <p className="text-gray-400">No content available for this section.</p>
                        )}
                    </div>

                    {finishMessage && (
                        <div className="bg-green-500/10 border border-green-500/30 backdrop-blur-sm rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500/20">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-green-400 mb-2">Activity Complete!</h3>
                                    <p className="text-gray-300">{finishMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <Page title={`Quark | ${courseTitle}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 h-[calc(100vh-7rem)] flex">
                {/* Sidebar */}
                <aside className="w-80 border-r border-white/10 bg-white/5 overflow-y-auto flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white mb-2">{courseTitle}</h2>
                    </div>

                    {/* Pseudo-tab for course introduction */}
                    <button
                        className={`w-full text-left px-6 py-3 hover:bg-white/10 transition cursor-pointer ${activeTab === 'intro' ? 'bg-white/10 border-l-4 border-purple-500' : 'border-l-4 border-transparent'}`}
                        onClick={() => setActiveTab('intro')}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500/20">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-purple-400" style={{ fontSize: 22, width: 22, height: 22 }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white">Course Introduction</div>
                                {/* Show a short preview of the intro markdown (first 120 chars, no markdown) */}
                                {(() => {
                                    const introMarkdown = getIntroMarkdown(course);
                                    if (introMarkdown) {
                                        const plain = introMarkdown.replace(/[#*_>\[\]\(\)!\-]/g, "").replace(/\n+/g, " ").trim();
                                        return (
                                            <div 
                                                className="text-xs text-gray-400 mt-1 truncate"
                                            >
                                                {plain}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </button>

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

                    <div className="flex-1">
                        {!loading && !error && chapters.map((chapter, chapterIdx) => (
                        <div key={chapter.id} className="border-b border-white/10">
                            <div className="px-6 py-2 bg-white/3">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                                    {chapter.name}
                                </h3>
                                {chapter.description && (
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                        {chapter.description}
                                    </p>
                                )}
                            </div>
                            <div className="py-2">
                                {chapter.items && chapter.items.length > 0 ? (
                                    chapter.items.map((item, itemIdx) => (
                                        <button
                                            key={`${chapter.id}-${item.type}-${item.id}-${itemIdx}`}
                                            onClick={() => setActiveTab({ chapterIdx, itemIdx })}
                                            className={`w-full text-left px-6 py-3 hover:bg-white/10 transition ${
                                                activeTab !== 'intro' && activeTab.chapterIdx === chapterIdx && activeTab.itemIdx === itemIdx
                                                    ? 'bg-white/10 border-l-4 border-blue-500'
                                                    : 'border-l-4 border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3 cursor-pointer">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: item.type === "LESSON" ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                                                    <FontAwesomeIcon 
                                                        icon={item.type === "LESSON" ? faBook : faPencil} 
                                                        className={item.type === "LESSON" ? "text-blue-400" : "text-green-400"}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-white truncate">{item.name}</div>
                                                    {item.description && (
                                                        <div className="text-xs text-gray-400 mt-1 truncate">
                                                            {item.description}
                                                        </div>
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
                <main className="flex-1 flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">Loading content...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : (
                        <>
                        {currentItem?.type === "LESSON" && (currentItem.pages?.length ?? 0) > 1 && (
                            <div className="border-t border-white/10 backdrop-blur-sm px-8 py-4">
                                <div className="max-w-7xl mx-auto flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentPageIndex === 0}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    ← Previous
                                </button>

                                <div className="text-lm text-gray-400">
                                    Page {currentPageIndex + 1} of {currentItem.pages?.length ?? 0}
                                </div>

                                <button
                                    onClick={() =>
                                    setCurrentPageIndex(prev =>
                                        Math.min((currentItem.pages?.length ?? 1) - 1, prev + 1)
                                    )
                                    }
                                    disabled={currentPageIndex === (currentItem.pages?.length ?? 1) - 1}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    Next →
                                </button>
                                </div>
                            </div>
                        )}
                            {currentItem?.type === "ACTIVITY" && totalSections > 1 && (
                                <div className="border-t border-white/10 backdrop-blur-sm px-8 py-4">
                                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentSectionIndex === 0}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                        >
                                            ← Previous
                                        </button>
                                        
                                        <div className="text-lm text-gray-400">
                                            Section {currentSectionIndex + 1} of {totalSections}
                                        </div>
                                        
                                        <button
                                            onClick={() => setCurrentSectionIndex(prev => Math.min((totalSections ?? 1) - 1, prev + 1))}
                                            disabled={currentSectionIndex === (totalSections ?? 1) - 1}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                            {currentItem?.type === "ACTIVITY" && 
                             currentSection?.sectionType === "CODE" ? (
                                <ActivityCodeLayout
                                    item={currentItem}
                                    section={currentSection}
                                    sectionIndex={currentSectionIndex}
                                    codeValue={codeValue}
                                    onCodeChange={setCodeValue}
                                    selectedTestCase={selectedTestCase}
                                    onSelectTestCase={setSelectedTestCase}
                                    testResults={testResults}
                                    isRunning={isRunning}
                                    onRun={handleRunCode}
                                    onSubmit={handleSubmitCode}
                                    PreviewRenderer={PreviewRenderer}
                                />
                            ) : (
                                // Standard layout for lessons and MCQ sections
                                <div className="flex-1 overflow-y-auto">
                                    <div className="max-w-8xl mx-auto px-12 py-8">
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
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </Page>
    );
}