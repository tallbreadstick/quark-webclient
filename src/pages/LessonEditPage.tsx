import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import { fetchCourseWithChapters } from "../endpoints/CourseHandler";
import { fetchChapterWithItems } from "../endpoints/ChapterHandler";

// Type imports
import type { Chapter, Item, Selection } from "../types/ChapterEditorTypes";

// Utility imports
import { assignUiSerials } from "../utils/chapterEditorUtils";

// Action imports
import { 
    addChapterAction, 
    removeChapterAction, 
    updateChapterAction, 
    reorderChaptersAction, 
} from "../utils/chapterActions";
import { 
    createItemAction, 
    removeItemAction, 
    updateItemAction,
    reorderItemsAction
} from "../utils/itemActions";

// Component imports
import { ChapterSidebar } from "../components/ChapterSidebar";
import { ChapterEditor } from "../components/ChapterEditor";
import { ItemEditor } from "../components/ItemEditor";
import { ItemTypeModal } from "../components/ItemTypeModal";
import { LoadingState, ErrorState, EmptySelectionState } from "../components/ChapterEditorStates";
import AlertModal from "../components/modals/AlertModal";
import ActionModal from "../components/modals/ActionModal";

// Main Application Component
export default function ChapterEditPage(): React.ReactElement {
    const { courseId } = useParams<{ courseId: string }>();
    const location = useLocation();
    const { userSession, setUserSession } = loadSessionState();

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courseName, setCourseName] = useState<string>("");

    // Track detailed selection
    const [selection, setSelection] = useState<Selection>(null);

    // Item type selection modal
    const [showItemTypeModal, setShowItemTypeModal] = useState(false);
    const [pendingChapterId, setPendingChapterId] = useState<number | null>(null);

    // Finish message editor preview mode
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    // UI state: track whether time limit input is enabled per item uiSerialId
    const [timeLimitEnabledMap, setTimeLimitEnabledMap] = useState<Record<string, boolean>>({});

    // Delete modal states
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'chapter' | 'item';
        chapterId: number;
        itemId?: number;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");

    // Refresh trigger for forcing data updates
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch course and chapters on mount and when refreshTrigger changes
    useEffect(() => {
        const loadCourseData = async () => {
            if (!courseId) {
                setError("No course ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const jwt = userSession?.jwt ?? "";
                const result = await fetchCourseWithChapters(Number(courseId), jwt);

                if (result.ok) {
                    setCourseName(result.ok.name);
                    const chaptersWithItems: Chapter[] = result.ok.chapters.map((ch: any) => ({
                        ...ch,
                        items: [] // Items will be loaded when chapter is selected
                    }));
                    setChapters(chaptersWithItems);
                    setError(null);
                    
                    // Clear selection to force re-selection
                    setSelection(null);
                } else {
                    setError(result.err ?? "Unknown error");
                }
            } catch (err) {
                setError("Failed to load course data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadCourseData();
    }, [courseId, userSession?.jwt, refreshTrigger]);

    // Refresh data when page becomes visible again (e.g., after navigating back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Small delay to ensure any previous operations are complete
                setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Also check for location state that might indicate we need to refresh
    useEffect(() => {
        if (location.state?.refresh) {
            setRefreshTrigger(prev => prev + 1);
            // Clear the state to prevent infinite refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Ensure something is selected on load
    useEffect(() => {
        if (!selection && chapters.length > 0) {
            setSelection({ type: 'chapter', id: chapters[0].id });
        }
    }, [chapters, selection]);

    // Load chapter items when a chapter is selected
    useEffect(() => {
        const loadChapterItems = async () => {
            if (selection?.type === 'chapter') {
                const chapter = chapters.find(c => c.id === selection.id);
                if (chapter && chapter.items.length === 0) {
                    try {
                        const jwt = userSession?.jwt ?? "";
                        const result = await fetchChapterWithItems(selection.id, jwt);

                        if (result.ok) {
                            const withSerials = assignUiSerials(result.ok!.items as Item[]);
                            setChapters(prev => prev.map(c =>
                                c.id === selection.id ? { ...c, items: withSerials } : c
                            ));
                        }
                    } catch (err) {
                        console.error("Failed to load chapter items:", err);
                    }
                }
            }
        };

        loadChapterItems();
    }, [selection, chapters, userSession?.jwt]);

    // Handle delete button click (show confirmation modal)
    const handleDeleteClick = (chapterId: number, itemId?: number) => {
        if (itemId !== undefined) {
            // Deleting an item
            const chapter = chapters.find(c => c.id === chapterId);
            const item = chapter?.items.find(i => i.id === itemId);
            if (chapter && item) {
                setDeleteTarget({ type: 'item', chapterId, itemId });
                setShowDeleteConfirmModal(true);
            }
        } else {
            // Deleting a chapter
            const chapter = chapters.find(c => c.id === chapterId);
            if (chapter) {
                setDeleteTarget({ type: 'chapter', chapterId });
                setShowDeleteConfirmModal(true);
            }
        }
    };

    // Handle confirmed delete
    const handleConfirmDelete = async () => {
        if (!deleteTarget || !userSession?.jwt) return;

        setIsDeleting(true);
        try {
            if (deleteTarget.type === 'chapter') {
                // Find chapter name before deleting
                const chapter = chapters.find(c => c.id === deleteTarget.chapterId);
                const chapterName = chapter?.name || "Chapter";
                
                // Delete chapter
                await removeChapterAction(
                    deleteTarget.chapterId,
                    userSession.jwt,
                    chapters,
                    selection,
                    setChapters,
                    setSelection
                );
                
                setDeleteSuccessMessage(`Chapter "${chapterName}" has been deleted successfully.`);
            } else {
                // Deleting an item
                const chapter = chapters.find(c => c.id === deleteTarget.chapterId);
                const item = chapter?.items.find(i => i.id === deleteTarget.itemId);
                const itemName = item?.name || "Item";
                
                if (deleteTarget.itemId) {
                    await removeItemAction(
                        deleteTarget.chapterId,
                        deleteTarget.itemId,
                        chapters,
                        selection,
                        userSession.jwt,
                        setChapters,
                        setSelection
                    );
                    
                    setDeleteSuccessMessage(`Item "${itemName}" has been deleted successfully.`);
                }
            }
            
            // Show success modal
            setShowDeleteConfirmModal(false);
            setShowDeleteSuccessModal(true);
            
            // Force a refresh after successful delete
            setTimeout(() => {
                setRefreshTrigger(prev => prev + 1);
            }, 500);
        } catch (error) {
            console.error("Failed to delete:", error);
            setError("Failed to delete. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle delete cancellation
    const handleCancelDelete = () => {
        setShowDeleteConfirmModal(false);
        setDeleteTarget(null);
    };

    // Handle success modal close
    const handleSuccessModalClose = () => {
        setShowDeleteSuccessModal(false);
        setDeleteTarget(null);
    };

    // Manual refresh function
    const handleManualRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // --- Drag & Drop Handlers ---

    function onDragStart(e: React.DragEvent, type: 'chapter' | 'item', data: any) {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, ...data }));
        e.dataTransfer.effectAllowed = 'move';
    }

    async function onDrop(e: React.DragEvent, targetChapterId: number, targetIndex?: number) {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr || !courseId) return;

        try {
            const data = JSON.parse(dataStr);

            // Reorder Chapters
            if (data.type === 'chapter' && typeof targetIndex === 'number') {
                await reorderChaptersAction(
                    Number(courseId), 
                    data.index, 
                    targetIndex, 
                    chapters, 
                    userSession?.jwt ?? "", 
                    setChapters
                );
                // Refresh after reorder
                setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 300);
            }

            // Reorder Items - now with API call
            if (data.type === 'item') {
                const { chapterId: fromChapId, index: fromIdx } = data;
                const toIdx = targetIndex ?? 0;
                
                await reorderItemsAction(
                    fromChapId,
                    fromIdx,
                    targetChapterId,
                    toIdx,
                    chapters,
                    userSession?.jwt ?? "",
                    setChapters
                );
                // Refresh after reorder
                setTimeout(() => {
                    setRefreshTrigger(prev => prev + 1);
                }, 300);
            }
        } catch (e) {
            console.error("Error during drop:", e);
        }
    }

    // --- Selection Data Helper ---

    const getSelectionData = () => {
        if (!selection) return null;
        const chap = chapters.find(c => c.id === (selection.type === 'chapter' ? selection.id : selection.chapterId));
        if (!chap) return null;

        if (selection.type === 'chapter') return { type: 'chapter', data: chap };

        const item = chap.items.find(i => i.uiSerialId === selection.serialId);
        if (!item) return null;

        return { type: 'item', data: item, chapter: chap };
    };

    const activeData = getSelectionData();

    // Show loading state
    if (loading) {
        return <LoadingState userSession={userSession} setUserSession={setUserSession} />;
    }

    // Show error state
    if (error) {
        return <ErrorState error={error} userSession={userSession} setUserSession={setUserSession} />;
    }

    return (
        <Page title={`Quark | ${courseName} - Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
            <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative chapter-editor">
                <style>{`
                    .chapter-editor input[type="date"]::-webkit-calendar-picker-indicator,
                    .chapter-editor input[type="time"]::-webkit-calendar-picker-indicator {
                        cursor: pointer;
                        filter: invert(32%) sepia(10%) saturate(1348%) hue-rotate(179deg) brightness(93%) contrast(87%);
                    }
                    
                    /* Add pointer cursor to all clickable elements */
                    .chapter-editor button,
                    .chapter-editor [role="button"],
                    .chapter-editor a,
                    .chapter-editor select,
                    .chapter-editor input[type="checkbox"],
                    .chapter-editor input[type="radio"] {
                        cursor: pointer !important;
                    }
                    
                    /* Style for draggable elements */
                    .chapter-editor [draggable="true"] {
                        cursor: grab !important;
                    }
                    
                    .chapter-editor [draggable="true"]:active {
                        cursor: grabbing !important;
                    }
                `}</style>

                {/* Background ambient effect */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-indigo-900/20 blur-[100px] pointer-events-none" />

                {/* Sidebar */}
                <ChapterSidebar
                    courseId={courseId}
                    chapters={chapters}
                    selection={selection}
                    onSelectionChange={setSelection}
                    onAddChapter={() => addChapterAction(Number(courseId), chapters, userSession?.jwt ?? "", setChapters, setSelection)}
                    onRemoveChapter={(chapterId) => handleDeleteClick(chapterId)}
                    onOpenItemTypeModal={(chapterId) => {
                        setPendingChapterId(chapterId);
                        setShowItemTypeModal(true);
                    }}
                    onRemoveItem={(chapterId, itemId) => handleDeleteClick(chapterId, itemId)}
                    onDragStart={onDragStart}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                />

                {/* Main Content Area */}
                <main className="flex-1 bg-slate-950/30 backdrop-blur-sm p-8 overflow-y-auto relative custom-scrollbar">
                    {/* Header with refresh button */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-white">{courseName} - Chapter Editor</h1>
                        <button
                            onClick={handleManualRefresh}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                            title="Refresh data"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {!activeData ? (
                        <EmptySelectionState />
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
                            {activeData.type === 'chapter' ? (
                                <ChapterEditor
                                    chapter={activeData.data as Chapter}
                                    onNameChange={(name) => updateChapterAction((activeData.data as Chapter).id, { name }, chapters, userSession?.jwt ?? "", setChapters)}
                                    onDescriptionChange={(description) => updateChapterAction((activeData.data as Chapter).id, { description }, chapters, userSession?.jwt ?? "", setChapters)}
                                />
                            ) : (
                                <ItemEditor
                                    item={activeData.data as Item}
                                    chapter={activeData.chapter as Chapter}
                                    isPreviewMode={isPreviewMode}
                                    timeLimitEnabledMap={timeLimitEnabledMap}
                                    onNameChange={(name) => updateItemAction((activeData.chapter as Chapter).id, (activeData.data as Item).id, { name }, chapters, userSession?.jwt ?? "", setChapters)}
                                    onDescriptionChange={(description) => updateItemAction((activeData.chapter as Chapter).id, (activeData.data as Item).id, { description }, chapters, userSession?.jwt ?? "", setChapters)}
                                    onFinishMessageChange={(finishMessage) => updateItemAction((activeData.chapter as Chapter).id, (activeData.data as Item).id, { finishMessage }, chapters, userSession?.jwt ?? "", setChapters)}
                                    onTimeLimitEnabledChange={(serialKey, enabled) => setTimeLimitEnabledMap(prev => ({ ...prev, [serialKey]: enabled }))}
                                    onRulesetFieldUpdate={(field, value) => {
                                        const item = activeData.data as Item;
                                        let ruleset: any = { enabled: true };
                                        try {
                                            ruleset = item.ruleset ? (typeof item.ruleset === 'string' ? JSON.parse(item.ruleset) : item.ruleset) : { enabled: true };
                                        } catch {
                                            ruleset = { enabled: true };
                                        }
                                        const newRuleset = { ...ruleset, [field]: value };
                                        updateItemAction((activeData.chapter as Chapter).id, item.id, { ruleset: JSON.stringify(newRuleset) }, chapters, userSession?.jwt ?? "", setChapters);
                                    }}
                                    onPreviewModeToggle={() => setIsPreviewMode(!isPreviewMode)}
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Item Type Selection Modal */}
            <ItemTypeModal
                isOpen={showItemTypeModal}
                onLessonCreate={() => {
                    if (pendingChapterId) {
                        createItemAction("LESSON", pendingChapterId, chapters, userSession?.jwt ?? "", setChapters, setSelection);
                        setShowItemTypeModal(false);
                        setPendingChapterId(null);
                        // Refresh after a short delay to ensure data is consistent
                        setTimeout(() => {
                            setRefreshTrigger(prev => prev + 1);
                        }, 500);
                    }
                }}
                onActivityCreate={() => {
                    if (pendingChapterId) {
                        createItemAction("ACTIVITY", pendingChapterId, chapters, userSession?.jwt ?? "", setChapters, setSelection);
                        setShowItemTypeModal(false);
                        setPendingChapterId(null);
                        // Refresh after a short delay to ensure data is consistent
                        setTimeout(() => {
                            setRefreshTrigger(prev => prev + 1);
                        }, 500);
                    }
                }}
                onCancel={() => {
                    setShowItemTypeModal(false);
                    setPendingChapterId(null);
                }}
            />

            {/* Delete Confirmation Modal */}
            <ActionModal
                isOpen={showDeleteConfirmModal}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title={deleteTarget?.type === 'chapter' ? "Delete Chapter" : "Delete Item"}
                message={
                    deleteTarget?.type === 'chapter' 
                        ? "Are you sure you want to delete this chapter? This will also delete all items within it."
                        : "Are you sure you want to delete this item?"
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Delete Success Modal */}
            <AlertModal
                isOpen={showDeleteSuccessModal}
                onClose={handleSuccessModalClose}
                title="Deleted Successfully"
                message={deleteSuccessMessage}
                variant="success"
                buttonText="Okay"
            />
        </Page>
    );
}