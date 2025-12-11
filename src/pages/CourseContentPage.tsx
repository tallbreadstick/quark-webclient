import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faPencil, faCheckCircle, faPlay, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Editor from "@monaco-editor/react";
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
                                            mcq: sectionData.mcq,
                                            code: sectionData.code,
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
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [codeValue, setCodeValue] = useState("");
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [testResults, setTestResults] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

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

    // Reset page/section index when item changes
    useEffect(() => {
        setCurrentPageIndex(0);
        setCurrentSectionIndex(0);
        setCodeValue("");
        setTestResults(null);
        setSelectedTestCase(0);
    }, [selectedItem]);

    // Update code editor when section changes
    useEffect(() => {
        const currentSection = selectedItem ? chapters[selectedItem.chapterIdx]?.items?.[selectedItem.itemIdx]?.sections?.[currentSectionIndex] : null;
        if (currentSection?.sectionType === "CODE" && currentSection.code?.defaultCode) {
            setCodeValue(currentSection.code.defaultCode);
        } else {
            setCodeValue("");
        }
        setTestResults(null);
        setSelectedTestCase(0);
    }, [currentSectionIndex, selectedItem, chapters]);


    /**
     *  HANDLES RUN AND SUBMIT, STILL SIMULATED FOR NOW
     */

    const handleRunCode = () => {
        setIsRunning(true);
        // Simulate code execution
        setTimeout(() => {
            setTestResults("Test case passed!\nExpected output matches actual output.");
            setIsRunning(false);
        }, 1000);
    };
    const handleSubmitCode = () => {
        setIsRunning(true);
        // Simulate code submission
        setTimeout(() => {
            setTestResults("All test cases passed!\nSubmission accepted.");
            setIsRunning(false);
        }, 1500);
    };

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
                                        <p className="text-gray-300">{finishMessage}</p>
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
                            <div className="space-y-6">
                                <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-gray-200">
                                    <Suspense fallback={<div className="text-gray-400">Loading instructions...</div>}>
                                        <PreviewRenderer value={currentSection.mcq.instructions} />
                                    </Suspense>
                                </div>

                                <div className="space-y-6 mt-8">
                                    {currentSection.mcq.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="bg-white/5 border border-white/10 rounded-lg p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <h4 className="text-lg font-medium text-white">Question {qIdx + 1}</h4>
                                                <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-sm text-yellow-400">
                                                    {q.points} {q.points === 1 ? "point" : "points"}
                                                </span>
                                            </div>
                                            <p className="text-gray-200 mb-4">{q.question}</p>
                                            <div className="space-y-2">
                                                {q.choices.map((choice, cIdx) => (
                                                    <div
                                                        key={cIdx}
                                                        className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition cursor-pointer"
                                                    >
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`question-${qIdx}`}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-gray-300">{choice}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentSection?.sectionType === "CODE" && currentSection.code && (
                            <div className="space-y-6">
                                {/* This will be rendered differently in the main layout */}
                            </div>
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

                    <div className="flex-1">
                        {!loading && !error && chapters.map((chapter, chapterIdx) => (
                        <div key={chapter.id} className="border-b border-white/10">
                            <div className="px-6 py-2 bg-white/3">
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
                            {currentItem?.type === "ACTIVITY" && 
                             chapters[selectedItem?.chapterIdx ?? 0]?.items?.[selectedItem?.itemIdx ?? 0]?.sections?.[currentSectionIndex]?.sectionType === "CODE" ? (
                                // LeetCode-style split layout for CODE sections
                                <div className="flex flex-1 h-full">
                                    {/* Left Panel - Problem Description */}
                                    <div className="w-1/2 border-r border-white/10 flex flex-col h-full">
                                        <div className="flex-1 overflow-y-auto">
                                            <div className="p-6">
                                                {currentItem && (
                                                    <div className="mb-6">
                                                        <h1 className="text-2xl font-bold text-white mb-2">{currentItem.name}</h1>
                                                        {currentItem.description && (
                                                            <p className="text-sm text-gray-400 mb-4">{currentItem.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                                                                Section {currentSectionIndex + 1} of {currentItem.sections?.length ?? 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {(() => {
                                                    const currentSection = chapters[selectedItem?.chapterIdx ?? 0]?.items?.[selectedItem?.itemIdx ?? 0]?.sections?.[currentSectionIndex];
                                                    return currentSection?.code ? (
                                                        <div className="space-y-6">
                                                            <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-code:text-blue-300">
                                                                <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                                                                    <PreviewRenderer value={currentSection.code.instructions} />
                                                                </Suspense>
                                                            </div>
                                                            
                                                            {currentSection.code.sources && currentSection.code.sources.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources</h4>
                                                                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                                                        {currentSection.code.sources.map((source, idx) => (
                                                                            <li key={idx}>{source}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Panel - Code Editor and Test Cases */}
                                    <div className="w-1/2 flex flex-col h-full">
                                        {/* Code Editor */}
                                        <div className="flex-1 flex flex-col border-b border-white/10">
                                            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Code</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleRunCode}
                                                        disabled={isRunning}
                                                        className="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        <FontAwesomeIcon icon={faPlay} className="text-xs" />
                                                        Run
                                                    </button>
                                                    <button
                                                        onClick={handleSubmitCode}
                                                        disabled={isRunning}
                                                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                                                        Submit
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <Editor
                                                    height="100%"
                                                    defaultLanguage="python"
                                                    value={codeValue}
                                                    onChange={(value) => setCodeValue(value || "")}
                                                    theme="vs-dark"
                                                    options={{
                                                        minimap: { enabled: false },
                                                        fontSize: 14,
                                                        lineNumbers: "on",
                                                        scrollBeyondLastLine: false,
                                                        automaticLayout: true,
                                                        tabSize: 4,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Test Cases Panel */}
                                        <div className="h-64 flex flex-col bg-black/40">
                                            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                                                <div className="flex gap-2">
                                                    {(() => {
                                                        const currentSection = chapters[selectedItem?.chapterIdx ?? 0]?.items?.[selectedItem?.itemIdx ?? 0]?.sections?.[currentSectionIndex];
                                                        const testCases = currentSection?.code?.testCases || [];
                                                        return testCases.map((testCase, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setSelectedTestCase(idx)}
                                                                className={`px-3 py-1.5 text-sm rounded transition ${
                                                                    selectedTestCase === idx
                                                                        ? "bg-white/20 text-white"
                                                                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                                                                }`}
                                                            >
                                                                Case {idx + 1}
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4">
                                                {testResults ? (
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-semibold text-green-400">Test Result</h4>
                                                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">{testResults}</pre>
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const currentSection = chapters[selectedItem?.chapterIdx ?? 0]?.items?.[selectedItem?.itemIdx ?? 0]?.sections?.[currentSectionIndex];
                                                        const testCase = currentSection?.code?.testCases?.[selectedTestCase];
                                                        return testCase ? (
                                                            <div className="space-y-3 text-sm">
                                                                <div>
                                                                    <span className="text-gray-400">Input:</span>
                                                                    <div className="mt-1 p-2 bg-white/5 rounded border border-white/10">
                                                                        <code className="text-gray-300">{testCase.driver}</code>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">Expected Output:</span>
                                                                    <div className="mt-1 p-2 bg-white/5 rounded border border-white/10">
                                                                        <code className="text-gray-300">{testCase.expected}</code>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 pt-2">
                                                                    <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                                                                        {testCase.points} {testCase.points === 1 ? "point" : "points"}
                                                                    </span>
                                                                    {testCase.hidden && (
                                                                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                                                                            Hidden
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                            
                            {currentItem?.type === "LESSON" && (currentItem.pages?.length ?? 0) > 1 && (
                                <div className="border-t border-white/10 backdrop-blur-sm px-8 py-4">
                                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentPageIndex === 0}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            ← Previous
                                        </button>
                                        
                                        <div className="text-sm text-gray-400">
                                            Page {currentPageIndex + 1} of {currentItem.pages?.length ?? 0}
                                        </div>
                                        
                                        <button
                                            onClick={() => setCurrentPageIndex(prev => Math.min((currentItem.pages?.length ?? 1) - 1, prev + 1))}
                                            disabled={currentPageIndex === (currentItem.pages?.length ?? 1) - 1}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                            {currentItem?.type === "ACTIVITY" && (currentItem.sections?.length ?? 0) > 1 && (
                                <div className="border-t border-white/10 backdrop-blur-sm px-8 py-4">
                                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentSectionIndex === 0}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            ← Previous Section
                                        </button>
                                        
                                        <div className="text-sm text-gray-400">
                                            Section {currentSectionIndex + 1} of {currentItem.sections?.length ?? 0}
                                        </div>
                                        
                                        <button
                                            onClick={() => setCurrentSectionIndex(prev => Math.min((currentItem.sections?.length ?? 1) - 1, prev + 1))}
                                            disabled={currentSectionIndex === (currentItem.sections?.length ?? 1) - 1}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            Next Section →
                                        </button>
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