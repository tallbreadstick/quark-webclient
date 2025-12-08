import type { Chapter, Item, Selection } from "../types/ChapterEditorTypes";
import { fetchChapterWithItems } from "../endpoints/ChapterHandler";
import { addLesson as apiAddLesson, editLesson as apiEditLesson, deleteLesson as apiDeleteLesson, type LessonRequest } from "../endpoints/LessonHandler";
import { addActivity as apiAddActivity, editActivity as apiEditActivity, deleteActivity as apiDeleteActivity, type ActivityRequest } from "../endpoints/ActivityHandler";
import { assignUiSerials, parseRuleset } from "./chapterEditorUtils";

/**
 * Create a new lesson or activity item
 */
export async function createItemAction(
    itemType: "LESSON" | "ACTIVITY",
    chapterId: number,
    chapters: Chapter[],
    jwt: string,
    onChaptersUpdate: (chapters: Chapter[]) => void,
    onSelectionUpdate: (selection: Selection) => void
) {
    try {
        const chapter = chapters.find(c => c.id === chapterId);
        const itemCount = chapter?.items.length ?? 0;

        if (itemType === "LESSON") {
            const request: LessonRequest = {
                name: `New Lesson ${itemCount + 1}`,
                description: "Lesson description",
                icon: "📄",
                finishMessage: "Great job completing this lesson!"
            };

            const result = await apiAddLesson(chapterId, request, jwt);

            if (result.ok) {
                // Reload chapter items to get the new item with proper ID
                const chapterResult = await fetchChapterWithItems(chapterId, jwt);
                if (chapterResult.ok) {
                    const withSerials = assignUiSerials(chapterResult.ok!.items as Item[]);
                    onChaptersUpdate(chapters.map(c =>
                        c.id === chapterId ? { ...c, items: withSerials } : c
                    ));
                    // Select the newly created item (by UI serial id)
                    const newItem = withSerials[withSerials.length - 1];
                    if (newItem) {
                        onSelectionUpdate({ type: 'item', chapterId, serialId: newItem.uiSerialId! });
                    }
                }
            } else {
                alert("Failed to add lesson: " + result.err);
            }
        } else {
            const request: ActivityRequest = {
                name: `New Activity ${itemCount + 1}`,
                description: "Activity description",
                icon: "🧪",
                ruleset: {
                    enabled: true
                },
                finishMessage: "Excellent work on this activity!"
            };

            const result = await apiAddActivity(chapterId, request, jwt);

            if (result.ok) {
                // Reload chapter items to get the new item with proper ID
                const chapterResult = await fetchChapterWithItems(chapterId, jwt);
                if (chapterResult.ok) {
                    const withSerials = assignUiSerials(chapterResult.ok!.items as Item[]);
                    onChaptersUpdate(chapters.map(c =>
                        c.id === chapterId ? { ...c, items: withSerials } : c
                    ));
                    // Select the newly created item (by UI serial id)
                    const newItem = withSerials[withSerials.length - 1];
                    if (newItem) {
                        onSelectionUpdate({ type: 'item', chapterId, serialId: newItem.uiSerialId! });
                    }
                }
            } else {
                alert("Failed to add activity: " + result.err);
            }
        }
    } catch (err) {
        console.error("Error adding item:", err);
        alert("Error adding item");
    }
}

/**
 * Remove/delete an item from a chapter
 */
export async function removeItemAction(
    chapterId: number,
    itemId: number,
    chapters: Chapter[],
    selection: Selection,
    jwt: string,
    onChaptersUpdate: (chapters: Chapter[]) => void,
    onSelectionUpdate: (selection: Selection) => void
) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
        const chapter = chapters.find(c => c.id === chapterId);
        const item = chapter?.items.find(i => i.id === itemId);

        if (!item) return;

        let result;
        if (item.itemType === "LESSON") {
            result = await apiDeleteLesson(itemId, jwt);
        } else {
            result = await apiDeleteActivity(itemId, jwt);
        }

        if (result.ok) {
            onChaptersUpdate(chapters.map(c =>
                c.id === chapterId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
            ));
            if (selection?.type === 'item' && selection.chapterId === chapterId && selection.serialId === item.uiSerialId) {
                onSelectionUpdate({ type: 'chapter', id: chapterId });
            }
        } else {
            alert("Failed to delete item: " + result.err);
        }
    } catch (err) {
        console.error("Error deleting item:", err);
        alert("Error deleting item");
    }
}

/**
 * Update an item (name, description, icon, finishMessage, ruleset)
 */
export async function updateItemAction(
    chapterId: number,
    itemId: number,
    patch: Partial<Item>,
    chapters: Chapter[],
    jwt: string,
    onChaptersUpdate: (chapters: Chapter[]) => void
) {
    // Update UI immediately for responsive feel
    onChaptersUpdate(chapters.map(c => c.id === chapterId ? {
        ...c,
        items: c.items.map(i => i.id === itemId ? { ...i, ...patch } : i)
    } : c));

    // Get the updated item data
    const chapter = chapters.find(c => c.id === chapterId);
    const item = chapter?.items.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, ...patch };

    try {
        let result;

        if (updatedItem.itemType === "LESSON") {
            const request: LessonRequest = {
                name: updatedItem.name,
                description: updatedItem.description,
                icon: updatedItem.icon,
                finishMessage: updatedItem.finishMessage
            };
            result = await apiEditLesson(itemId, request, jwt);
        } else {
            const ruleset = parseRuleset(updatedItem.ruleset);
            const request: ActivityRequest = {
                name: updatedItem.name,
                description: updatedItem.description,
                icon: updatedItem.icon,
                ruleset: {
                    enabled: ruleset.enabled ?? true,
                    closeDateTime: ruleset.closeDateTime,
                    timeLimit: ruleset.timeLimit
                },
                finishMessage: updatedItem.finishMessage ?? ""
            };
            result = await apiEditActivity(itemId, request, jwt);
        }

        if (!result.ok) {
            console.error("Failed to update item:", result.err);
        }
    } catch (err) {
        console.error("Error updating item:", err);
    }
}

/**
 * Reorder items via drag and drop (within same chapter or between chapters)
 */
export function reorderItemsAction(
    fromChapterId: number,
    fromIdx: number,
    toChapterId: number,
    toIdx: number,
    chapters: Chapter[],
    onChaptersUpdate: (chapters: Chapter[]) => void
) {
    onChaptersUpdate(chapters.map(c => ({ ...c, items: [...c.items] })).reduce((copy, chapter) => {
        if (chapter.id === fromChapterId && chapter.id === toChapterId) {
            // Reordering within same chapter
            const [movedItem] = chapter.items.splice(fromIdx, 1);
            chapter.items.splice(toIdx, 0, movedItem);
        } else if (chapter.id === fromChapterId) {
            // Remove from source chapter (will be added to dest below)
        } else if (chapter.id === toChapterId) {
            // Add to destination chapter
        }
        copy.push(chapter);
        return copy;
    }, [] as Chapter[]));

    // TODO: Call item reorder API when available
}
