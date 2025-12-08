import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import type { Chapter, Course, Item } from "../types/CourseContentTypes";
import { 
    fetchCourse, 
    fetchChaptersWithItems, 
    fetchUserProgress,
    getNextItem,
    getPreviousItem
} from "../utils/courseContentUtils";
import { CourseContentSidebar } from "../components/CourseContentSidebar";
import { LessonViewer } from "../components/LessonViewer";
import { ActivityViewer } from "../components/ActivityViewer";

export default function CourseContent() {
    const { courseId } = useParams<{ courseId: string }>();
    const { userSession, setUserSession } = loadSessionState();

    const [course, setCourse] = useState<Course | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProgress, setUserProgress] = useState<number | null>(null);

    const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError(null);
            try {
                const [courseData, chaptersData] = await Promise.all([
                    fetchCourse(Number(courseId)),
                    fetchChaptersWithItems(Number(courseId)),
                ]);

                if (cancelled) return;

                setCourse(courseData);
                setChapters(chaptersData);

                // Fetch user progress
                const progress = await fetchUserProgress(Number(courseId));
                setUserProgress(progress);

                // Default select first chapter and first item
                setSelectedChapterIndex(0);
                setSelectedItemIndex(0);
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

    const currentChapter = chapters[selectedChapterIndex];
    const currentItem = currentChapter?.items?.[selectedItemIndex];

    function handleSelectChapter(idx: number) {
        setSelectedChapterIndex(idx);
        setSelectedItemIndex(0);
    }

    function handleSelectItem(chapterIdx: number, itemIdx: number) {
        setSelectedChapterIndex(chapterIdx);
        setSelectedItemIndex(itemIdx);
    }

    function handleNext() {
        const next = getNextItem(chapters, selectedChapterIndex, selectedItemIndex);
        if (next) {
            setSelectedChapterIndex(next.chapterIndex);
            setSelectedItemIndex(next.itemIndex);
        }
    }

    function handlePrevious() {
        const prev = getPreviousItem(chapters, selectedChapterIndex, selectedItemIndex);
        if (prev) {
            setSelectedChapterIndex(prev.chapterIndex);
            setSelectedItemIndex(prev.itemIndex);
        }
    }

    // Only calculate navigation state if chapters are loaded
    const hasNext = chapters.length > 0 ? getNextItem(chapters, selectedChapterIndex, selectedItemIndex) !== null : false;
    const hasPrevious = chapters.length > 0 ? getPreviousItem(chapters, selectedChapterIndex, selectedItemIndex) !== null : false;

    return (
        <Page title={`Quark | ${course?.name ?? `Course ${courseId}`}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <CourseContentSidebar
                        courseName={course?.name ?? `Course ${courseId}`}
                        userProgress={userProgress}
                        chapters={chapters}
                        selectedChapterIndex={selectedChapterIndex}
                        selectedItemIndex={selectedItemIndex}
                        loading={loading}
                        error={error}
                        onSelectChapter={handleSelectChapter}
                        onSelectItem={handleSelectItem}
                    />

                    {/* Main content area */}
                    <main className="col-span-12 lg:col-span-9">
                        {loading ? (
                            <div className="text-center text-gray-400 py-12">Loading content...</div>
                        ) : error ? (
                            <div className="text-center text-red-400 py-12">{error}</div>
                        ) : !currentItem ? (
                            <div className="text-center text-gray-400 py-12">
                                <p>Select a lesson or activity to begin.</p>
                            </div>
                        ) : currentItem.type === "LESSON" ? (
                            <LessonViewer
                                lesson={currentItem}
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                hasNext={hasNext}
                                hasPrevious={hasPrevious}
                            />
                        ) : currentItem.type === "ACTIVITY" ? (
                            <ActivityViewer
                                activity={currentItem}
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                hasNext={hasNext}
                                hasPrevious={hasPrevious}
                            />
                        ) : (
                            <div className="text-center text-gray-400 py-12">
                                <p>Unknown item type.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </Page>
    );
}