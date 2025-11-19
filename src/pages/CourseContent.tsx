import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import api from "../scripts/api";

/*
my idea here is that this file will load the contents of each course (chapters, lessons) and will be in pages.
for now, it's static cause idk how we will add content here yet.
just change stuff here if u want
*/

type PageContent = {
    id: number;
    number?: number;
    content?: string | null;
};

type Lesson = {
    id: number;
    name: string;
    number?: number;
    description?: string | null;
    icon?: string | null;
    finishMessage?: string | null;
    pages?: PageContent[];
};

type Chapter = {
    id: number;
    name: string;
    number?: number;
    description?: string | null;
    icon?: string | null;
    lessons?: Lesson[];
};

type Course = {
    id: number;
    name: string;
    description?: string | null;
};

export default function CourseContent() {
    const { courseId } = useParams<{ courseId: string }>();
    const { userSession, setUserSession } = loadSessionState();

    const [course, setCourse] = useState<Course | null>(null);
    const [chapters, setChapters] = useState<Chapter[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProgress, setUserProgress] = useState<number | null>(null);

    const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
    const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError(null);
            try {
                const [courseRes, chRes] = await Promise.all([
                    api.get(`/course/${courseId}`),
                    api.get(`/chapter`, { params: { courseId } }),
                ]);

                if (cancelled) return;

                setCourse(courseRes.data ?? null);
                const list = Array.isArray(chRes.data) ? chRes.data : [];
                // Ensure lessons are arrays when present
                setChapters(list.map((c: any) => ({ ...c, lessons: Array.isArray(c.lessons) ? c.lessons : [] })));

                // Try to fetch user-specific course progress from common endpoints
                (async function fetchProgress() {
                    try {
                        // Try several plausible endpoints that backends commonly expose
                        const tryUrls = [
                            { url: `/user-course`, params: { courseId } },
                            { url: `/usercourse`, params: { courseId } },
                            { url: `/user-course/${courseId}` },
                            { url: `/usercourse/${courseId}` },
                            { url: `/course/${courseId}/progress` },
                        ];

                        for (const u of tryUrls) {
                            try {
                                const res = u.params ? await api.get(u.url, { params: u.params }) : await api.get(u.url);
                                if (res && res.status === 200 && res.data != null) {
                                    // Accept either { progress: 0.45 } or numeric value directly
                                    const data = res.data;
                                    let progressVal: number | null = null;
                                    if (typeof data === 'number') progressVal = data;
                                    else if (typeof data.progress === 'number') progressVal = data.progress;
                                    else if (typeof data === 'object' && data.userCourse && typeof data.userCourse.progress === 'number') progressVal = data.userCourse.progress;

                                    if (progressVal != null) {
                                        // progress expected as 0.0-1.0 or 0-100; normalize
                                        if (progressVal > 1) progressVal = Math.min(100, progressVal) / 100;
                                        setUserProgress(progressVal);
                                        break;
                                    }
                                }
                            } catch (e) {
                                // try next
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                })();

                // default select first chapter and first lesson
                setSelectedChapterIndex(0);
                setSelectedLessonIndex(0);
            } catch (err: any) {
                if (!cancelled) {
                    const status = err?.response?.status;
                    if (status === 401 || status === 403) setError("Unauthorized — please sign in to view this course.");
                    else setError(err?.message || "Failed to load course content");
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

    const currentChapter = chapters && chapters[selectedChapterIndex];
    const currentLesson = currentChapter && currentChapter.lessons && currentChapter.lessons[selectedLessonIndex];

    function selectChapter(idx: number) {
        setSelectedChapterIndex(idx);
        setSelectedLessonIndex(0);
    }

    function selectLesson(idx: number) {
        setSelectedLessonIndex(idx);
    }

    function nextChapter() {
        if (!chapters) return;
        setSelectedLessonIndex(0);
        setSelectedChapterIndex((i) => Math.min(i + 1, chapters.length - 1));
    }

    function prevChapter() {
        if (!chapters) return;
        setSelectedLessonIndex(0);
        setSelectedChapterIndex((i) => Math.max(i - 1, 0));
    }

    return (
        <Page title={`Quark | Course ${courseId}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
                    {/* Sidebar: course progress + TOC */}
                    <aside className="col-span-12 lg:col-span-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                            <h3 className="text-sm text-gray-400">{course?.name ?? `Course ${courseId}`}</h3>
                            <div className="mt-3">
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                        <div className="bg-[#3b82f6] h-2 rounded-full" style={{ width: `${Math.round((userProgress ?? 0) * 100)}%` }} />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">{userProgress == null ? '—' : `${Math.round((userProgress ?? 0) * 100)}%`} Complete</div>
                                </div>
                        </div>

                        <nav className="bg-white/5 border border-white/10 rounded-2xl p-3">
                            <h4 className="text-sm text-gray-400 mb-2">Course Contents</h4>
                            <ul className="space-y-2">
                                {loading && <li className="text-sm text-gray-400">Loading...</li>}
                                {error && <li className="text-sm text-red-400">{error}</li>}
                                {chapters && chapters.length === 0 && <li className="text-sm text-gray-400">No chapters yet.</li>}
                                {chapters && chapters.map((ch, ci) => (
                                    <li key={ch.id}>
                                        <button
                                            onClick={() => selectChapter(ci)}
                                            className={`w-full text-left px-3 py-2 rounded-md ${ci === selectedChapterIndex ? 'bg-white/7' : 'hover:bg-white/3'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-semibold text-white truncate">{ch.name}</div>
                                                    <div className="text-xs text-gray-400">{ch.lessons?.length ?? 0} lessons</div>
                                                </div>
                                                <div className="text-xs text-gray-400">{ch.number ?? '-'}</div>
                                            </div>
                                        </button>

                                        {/* Lessons list, visible when selected */}
                                        {ci === selectedChapterIndex && ch.lessons && ch.lessons.length > 0 && (
                                            <ul className="mt-2 ml-4 space-y-1">
                                                {ch.lessons.map((ls, li) => (
                                                    <li key={ls.id}>
                                                        <button onClick={() => selectLesson(li)} className={`w-full text-left px-2 py-1 rounded-md text-sm ${li === selectedLessonIndex ? 'bg-[#3b82f6] text-white' : 'text-gray-300 hover:bg-white/3'}`}>
                                                            {ls.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    {/* Main content area */}
                    <main className="col-span-12 lg:col-span-9">
                        <div className="mb-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-white">{currentChapter?.name ?? 'chapter name not found'}</h1>
                                    <p className="text-gray-400 mt-2">{currentChapter?.description ?? ''}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={prevChapter} className="px-3 py-2 bg-white/5 rounded-md">Previous</button>
                                    <button onClick={nextChapter} className="px-3 py-2 bg-[#3b82f6] rounded-md text-white">Next</button>
                                </div>
                            </div>
                        </div>

                        <section className="space-y-6">
                            {/* Lesson content box */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold text-white">{currentLesson?.name ?? 'Select a lesson'}</h2>
                                <p className="text-sm text-gray-400 mt-2">{currentLesson?.description ?? ''}</p>

                                <div className="mt-6 bg-white/6 rounded-xl p-4">
                                    {/* If pages are available show first page content, else show lesson finishMessage or placeholder */}
                                    {currentLesson?.pages && currentLesson.pages.length > 0 ? (
                                        <div dangerouslySetInnerHTML={{ __html: currentLesson.pages[0].content ?? '' }} />
                                    ) : currentLesson?.finishMessage ? (
                                        <div className="prose text-gray-200">{currentLesson.finishMessage}</div>
                                    ) : (
                                        <div className="text-gray-400">Content coming soon.</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-400">Key takeaways and resources go here.</div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-white/5 rounded-md">Previous Chapter</button>
                                    <button className="px-4 py-2 bg-[#3b82f6] text-white rounded-md">Next Chapter</button>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </Page>
    );
}