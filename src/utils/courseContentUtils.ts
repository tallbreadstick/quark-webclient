import api from "../scripts/api";
import type { Chapter, Course, CourseProgress } from "../types/CourseContentTypes";

/**
 * Fetch course details
 */
export async function fetchCourse(courseId: number): Promise<Course | null> {
    try {
        const response = await api.get(`/course/${courseId}`);
        return response.data ?? null;
    } catch (error) {
        console.error("Failed to fetch course:", error);
        return null;
    }
}

/**
 * Fetch chapters with items for a course
 */
export async function fetchChaptersWithItems(courseId: number): Promise<Chapter[]> {
    try {
        const response = await api.get(`/chapter`, { params: { courseId } });
        const chapters = Array.isArray(response.data) ? response.data : [];
        
        // Ensure items array exists
        return chapters.map((ch: any) => ({
            ...ch,
            items: Array.isArray(ch.items) ? ch.items : []
        }));
    } catch (error) {
        console.error("Failed to fetch chapters:", error);
        return [];
    }
}

/**
 * Fetch user progress for a course
 */
export async function fetchUserProgress(courseId: number): Promise<number | null> {
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
                const data = res.data;
                let progressVal: number | null = null;
                
                if (typeof data === 'number') progressVal = data;
                else if (typeof data.progress === 'number') progressVal = data.progress;
                else if (typeof data === 'object' && data.userCourse && typeof data.userCourse.progress === 'number') {
                    progressVal = data.userCourse.progress;
                }

                if (progressVal != null) {
                    // Normalize progress to 0.0-1.0
                    if (progressVal > 1) progressVal = Math.min(100, progressVal) / 100;
                    return progressVal;
                }
            }
        } catch (e) {
            // Continue to next URL
        }
    }
    
    return null;
}

/**
 * Calculate the total number of items across all chapters
 */
export function getTotalItemCount(chapters: Chapter[]): number {
    return chapters.reduce((sum, ch) => sum + (ch.items?.length ?? 0), 0);
}

/**
 * Find the next item in the course
 */
export function getNextItem(
    chapters: Chapter[], 
    currentChapterIndex: number, 
    currentItemIndex: number
): { chapterIndex: number; itemIndex: number } | null {
    // Safety check: ensure chapters exist and index is valid
    if (!chapters || chapters.length === 0 || currentChapterIndex >= chapters.length || currentChapterIndex < 0) {
        return null;
    }
    
    const currentChapter = chapters[currentChapterIndex];
    if (!currentChapter) return null;
    
    // Check if there's a next item in current chapter
    if (currentChapter.items && currentItemIndex < currentChapter.items.length - 1) {
        return { chapterIndex: currentChapterIndex, itemIndex: currentItemIndex + 1 };
    }
    
    // Check if there's a next chapter
    if (currentChapterIndex < chapters.length - 1) {
        const nextChapter = chapters[currentChapterIndex + 1];
        if (nextChapter && nextChapter.items && nextChapter.items.length > 0) {
            return { chapterIndex: currentChapterIndex + 1, itemIndex: 0 };
        }
    }
    
    return null;
}

/**
 * Find the previous item in the course
 */
export function getPreviousItem(
    chapters: Chapter[], 
    currentChapterIndex: number, 
    currentItemIndex: number
): { chapterIndex: number; itemIndex: number } | null {
    // Safety check: ensure chapters exist and index is valid
    if (!chapters || chapters.length === 0 || currentChapterIndex >= chapters.length || currentChapterIndex < 0) {
        return null;
    }
    
    // Check if there's a previous item in current chapter
    if (currentItemIndex > 0) {
        return { chapterIndex: currentChapterIndex, itemIndex: currentItemIndex - 1 };
    }
    
    // Check if there's a previous chapter
    if (currentChapterIndex > 0) {
        const prevChapter = chapters[currentChapterIndex - 1];
        if (prevChapter && prevChapter.items && prevChapter.items.length > 0) {
            return { chapterIndex: currentChapterIndex - 1, itemIndex: prevChapter.items.length - 1 };
        }
    }
    
    return null;
}
