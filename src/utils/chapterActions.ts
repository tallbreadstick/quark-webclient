import type { Chapter, Selection } from "../types/ChapterEditorTypes";
import { fetchCourseWithChapters } from "../endpoints/CourseHandler";
import { addChapter as apiAddChapter, editChapter as apiEditChapter, deleteChapter as apiDeleteChapter, reorderChapters as apiReorderChapters, type ChapterRequest } from "../endpoints/ChapterHandler";

/**
 * Add a new chapter to the course
 */
export async function addChapterAction(
    courseId: number,
    chapters: Chapter[],
    jwt: string,
    onChaptersUpdate: (chapters: Chapter[]) => void,
    onSelectionUpdate: (selection: Selection) => void
) {
    const request: ChapterRequest = {
        name: `Chapter ${chapters.length + 1}: New Module`,
        description: "",
        icon: "📚"
    };

    try {
        const result = await apiAddChapter(courseId, request, jwt);

        if (result.ok) {
            // Reload course data to get the new chapter with proper ID
            const courseResult = await fetchCourseWithChapters(courseId, jwt);
            if (courseResult.ok) {
                const chaptersWithItems: Chapter[] = courseResult.ok.chapters.map((ch: any) => ({
                    ...ch,
                    items: chapters.find(c => c.id === ch.id)?.items ?? []
                }));
                onChaptersUpdate(chaptersWithItems);
                // Select the newly created chapter
                const newChapter = chaptersWithItems[chaptersWithItems.length - 1];
                if (newChapter) {
                    onSelectionUpdate({ type: 'chapter', id: newChapter.id });
                }
            }
        } else {
            console.error("Failed to add chapter:", result.err);
        }
    } catch (err) {
        console.error("Error adding chapter:", err);
    }
}

/**
 * Remove/delete a chapter
 * Note: Confirmation is handled by ActionModal in the UI
 */
export async function removeChapterAction(
    chapterId: number,
    jwt: string,
    chapters: Chapter[],
    selection: Selection,
    onChaptersUpdate: (chapters: Chapter[]) => void,
    onSelectionUpdate: (selection: Selection) => void
) {
    try {
        const result = await apiDeleteChapter(chapterId, jwt);

        if (result.ok) {
            onChaptersUpdate(chapters.filter(c => c.id !== chapterId));
            
            if (selection?.type === 'chapter' && selection.id === chapterId) {
                onSelectionUpdate(null);
            }
        } else {
            console.error("Failed to delete chapter:", result.err);
            throw new Error(result.err ?? "Failed to delete chapter");
        }
    } catch (err) {
        console.error("Error deleting chapter:", err);
        throw err;
    }
}

/**
 * Update a chapter (name, description, icon)
 */
export async function updateChapterAction(
    chapterId: number,
    patch: Partial<Chapter>,
    chapters: Chapter[],
    jwt: string,
    onChaptersUpdate: (chapters: Chapter[]) => void
) {
    // Update UI immediately for responsive feel
    onChaptersUpdate(chapters.map(c => c.id === chapterId ? { ...c, ...patch } : c));

    // Get the updated chapter data
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const updatedChapter = { ...chapter, ...patch };

    try {
        const request: ChapterRequest = {
            name: updatedChapter.name,
            description: updatedChapter.description,
            icon: updatedChapter.icon
        };

        const result = await apiEditChapter(chapterId, request, jwt);

        if (!result.ok) {
            console.error("Failed to update chapter:", result.err);
        }
    } catch (err) {
        console.error("Error updating chapter:", err);
    }
}

/**
 * Reorder chapters via drag and drop
 */
export async function reorderChaptersAction(
    courseId: number,
    fromIdx: number,
    toIdx: number,
    chapters: Chapter[],
    jwt: string,
    onChaptersUpdate: (chapters: Chapter[]) => void
) {
    const newChapters = [...chapters];
    const [moved] = newChapters.splice(fromIdx, 1);
    newChapters.splice(toIdx, 0, moved);

    // Update UI immediately
    onChaptersUpdate(newChapters);

    // Send reorder to API
    try {
        const chapterIds = newChapters.map(c => c.id);
        const result = await apiReorderChapters(courseId, chapterIds, jwt);

        if (!result.ok) {
            console.error("Failed to reorder chapters:", result.err);
            // Revert the change
            onChaptersUpdate(chapters);
        }
    } catch (err) {
        console.error("Error reordering chapters:", err);
        // Revert the change
        onChaptersUpdate(chapters);
    }
}