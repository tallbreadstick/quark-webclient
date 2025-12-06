import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    reorderChaptersAction 
} from "../utils/chapterActions";
import { 
    createItemAction, 
    removeItemAction, 
    updateItemAction 
} from "../utils/itemActions";

// Component imports
import { ChapterSidebar } from "../components/ChapterSidebar";
import { ChapterEditor } from "../components/ChapterEditor";
import { ItemEditor } from "../components/ItemEditor";
import { ItemTypeModal } from "../components/ItemTypeModal";
import { LoadingState, ErrorState, EmptySelectionState } from "../components/ChapterEditorStates";

// Main Application Component
export default function ChapterEditPage(): React.ReactElement {
    const { courseId } = useParams<{ courseId: string }>();
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

    // Fetch course and chapters on mount
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
    }, [courseId, userSession?.jwt]);

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
                await reorderChaptersAction(Number(courseId), data.index, targetIndex, chapters, userSession?.jwt ?? "", setChapters);
            }

            // Reorder Items (TODO: needs item reorder API endpoint)
            if (data.type === 'item') {
                const { chapterId: fromChapId, index: fromIdx } = data;
                setChapters(prev => {
                    const copy = prev.map(c => ({ ...c, items: [...c.items] }));
                    const sourceChap = copy.find(c => c.id === fromChapId);
                    const destChap = copy.find(c => c.id === targetChapterId);

                    if (!sourceChap || !destChap) return prev;

                    const [movedItem] = sourceChap.items.splice(fromIdx, 1);
                    const finalIndex = targetIndex ?? destChap.items.length;
                    destChap.items.splice(finalIndex, 0, movedItem);

                    return copy;
                });
                // TODO: Call item reorder API when available
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
                    onRemoveChapter={(id) => removeChapterAction(id, userSession?.jwt ?? "", chapters, selection, setChapters, setSelection)}
                    onOpenItemTypeModal={(chapterId) => {
                        setPendingChapterId(chapterId);
                        setShowItemTypeModal(true);
                    }}
                    onRemoveItem={(chapterId, itemId) => removeItemAction(chapterId, itemId, chapters, selection, userSession?.jwt ?? "", setChapters, setSelection)}
                    onDragStart={onDragStart}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                />

                {/* Main Content Area */}
                <main className="flex-1 bg-slate-950/30 backdrop-blur-sm p-8 overflow-y-auto relative custom-scrollbar">
                    {!activeData ? (
                        <EmptySelectionState />
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
                            {activeData.type === 'chapter' && activeData.chapter === undefined ? (
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
                    }
                }}
                onActivityCreate={() => {
                    if (pendingChapterId) {
                        createItemAction("ACTIVITY", pendingChapterId, chapters, userSession?.jwt ?? "", setChapters, setSelection);
                        setShowItemTypeModal(false);
                        setPendingChapterId(null);
                    }
                }}
                onCancel={() => {
                    setShowItemTypeModal(false);
                    setPendingChapterId(null);
                }}
            />
        </Page>
    );
}
