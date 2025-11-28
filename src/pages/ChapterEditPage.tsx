import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from "@monaco-editor/react";
import PreviewRenderer from "../components/PreviewRenderer";
import {
    faTrash,
    faPlus,
    faFileLines,
    faFlask,
    faGripLinesVertical,
    faCube,
    faMousePointer,
    faBold,
    faItalic,
    faUnderline,
    faList,
    faImage,
    faInfoCircle,
    faChevronRight,
    faLayerGroup,
    faSpinner,
    faEye,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import { fetchCourseWithChapters, type CourseContentResponse } from "../endpoints/CourseHandler";
import { 
    addChapter as apiAddChapter, 
    editChapter as apiEditChapter, 
    deleteChapter as apiDeleteChapter,
    reorderChapters as apiReorderChapters,
    fetchChapterWithItems,
    type ChapterRequest,
    type ChapterItem
} from "../endpoints/ChapterHandler";
import {
    addLesson as apiAddLesson,
    editLesson as apiEditLesson,
    deleteLesson as apiDeleteLesson,
    type LessonRequest
} from "../endpoints/LessonHandler";
import {
    addActivity as apiAddActivity,
    editActivity as apiEditActivity,
    deleteActivity as apiDeleteActivity,
    type ActivityRequest
} from "../endpoints/ActivityHandler";

// --- Types ---
type Item = {
    id: number;
    itemType: "ACTIVITY" | "LESSON";
    idx: number;
    name: string;
    description: string;
    icon: string;
    finishMessage?: string;
    ruleset?: string;
};

type Chapter = {
    id: number;
    idx: number;
    name: string;
    description: string;
    icon: string;
    items: Item[]
};

type Selection = { type: 'chapter'; id: number } | { type: 'item'; chapterId: number; itemId: number } | null;

// Using shared `Page` component from `src/components/page/Page.tsx`

// --- Main Application Component ---
export default function ChapterEditPage(): React.ReactElement {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
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
                            setChapters(prev => prev.map(c => 
                                c.id === selection.id ? { ...c, items: result.ok!.items } : c
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

    // --- Actions ---

    async function addChapter() {
        if (!courseId) return;
        
        const request: ChapterRequest = {
            name: `Chapter ${chapters.length + 1}: New Module`,
            description: "",
            icon: "📚"
        };

        try {
            const jwt = userSession?.jwt ?? "";
            const result = await apiAddChapter(Number(courseId), request, jwt);
            
            if (result.ok) {
                // Reload course data to get the new chapter with proper ID
                const courseResult = await fetchCourseWithChapters(Number(courseId), jwt);
                if (courseResult.ok) {
                    const chaptersWithItems: Chapter[] = courseResult.ok.chapters.map((ch: any) => ({
                        ...ch,
                        items: chapters.find(c => c.id === ch.id)?.items ?? []
                    }));
                    setChapters(chaptersWithItems);
                    // Select the newly created chapter
                    const newChapter = chaptersWithItems[chaptersWithItems.length - 1];
                    if (newChapter) {
                        setSelection({ type: 'chapter', id: newChapter.id });
                    }
                }
            } else {
                console.error("Failed to add chapter:", result.err);
                alert("Failed to add chapter: " + result.err);
            }
        } catch (err) {
            console.error("Error adding chapter:", err);
            alert("Error adding chapter");
        }
    }

    async function removeChapter(id: number) {
        if (!confirm("Are you sure you want to delete this chapter?")) return;
        
        try {
            const jwt = userSession?.jwt ?? "";
            const result = await apiDeleteChapter(id, jwt);
            
            if (result.ok) {
                setChapters(prev => prev.filter(c => c.id !== id));
                if (selection?.type === 'chapter' && selection.id === id) {
                    setSelection(null);
                }
            } else {
                console.error("Failed to delete chapter:", result.err);
                alert("Failed to delete chapter: " + result.err);
            }
        } catch (err) {
            console.error("Error deleting chapter:", err);
            alert("Error deleting chapter");
        }
    }

    async function updateChapter(id: number, patch: Partial<Chapter>) {
        // Update UI immediately for responsive feel
        setChapters(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
        
        // Debounce API call
        const chapter = chapters.find(c => c.id === id);
        if (!chapter) return;
        
        const updatedChapter = { ...chapter, ...patch };
        
        try {
            const jwt = userSession?.jwt ?? "";
            const request: ChapterRequest = {
                name: updatedChapter.name,
                description: updatedChapter.description,
                icon: updatedChapter.icon
            };
            
            const result = await apiEditChapter(id, request, jwt);
            
            if (!result.ok) {
                console.error("Failed to update chapter:", result.err);
                // Optionally revert the change or show error
            }
        } catch (err) {
            console.error("Error updating chapter:", err);
        }
    }

    function openItemTypeModal(chapterId: number) {
        setPendingChapterId(chapterId);
        setShowItemTypeModal(true);
    }

    async function createItem(itemType: "LESSON" | "ACTIVITY") {
        if (!pendingChapterId) return;
        
        setShowItemTypeModal(false);
        const chapterId = pendingChapterId;
        setPendingChapterId(null);

        try {
            const jwt = userSession?.jwt ?? "";
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
                        setChapters(prev => prev.map(c => 
                            c.id === chapterId ? { ...c, items: chapterResult.ok!.items } : c
                        ));
                        // Select the newly created item
                        const newItem = chapterResult.ok.items[chapterResult.ok.items.length - 1];
                        if (newItem) {
                            setSelection({ type: 'item', chapterId, itemId: newItem.id });
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
                        setChapters(prev => prev.map(c => 
                            c.id === chapterId ? { ...c, items: chapterResult.ok!.items } : c
                        ));
                        // Select the newly created item
                        const newItem = chapterResult.ok.items[chapterResult.ok.items.length - 1];
                        if (newItem) {
                            setSelection({ type: 'item', chapterId, itemId: newItem.id });
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

    async function removeItemFromChapter(chapterId: number, itemId: number) {
        if (!confirm("Are you sure you want to delete this item?")) return;
        
        try {
            const jwt = userSession?.jwt ?? "";
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
                setChapters(prev => prev.map(c => 
                    c.id === chapterId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
                ));
                if (selection?.type === 'item' && selection.itemId === itemId) {
                    setSelection({ type: 'chapter', id: chapterId });
                }
            } else {
                alert("Failed to delete item: " + result.err);
            }
        } catch (err) {
            console.error("Error deleting item:", err);
            alert("Error deleting item");
        }
    }

    async function updateItem(chapterId: number, itemId: number, patch: Partial<Item>) {
        // Update UI immediately for responsive feel
        setChapters(prev => prev.map(c => c.id === chapterId ? {
            ...c,
            items: c.items.map(i => i.id === itemId ? { ...i, ...patch } : i)
        } : c));
        
        // Get the updated item data
        const chapter = chapters.find(c => c.id === chapterId);
        const item = chapter?.items.find(i => i.id === itemId);
        if (!item) return;
        
        const updatedItem = { ...item, ...patch };
        
        try {
            const jwt = userSession?.jwt ?? "";
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
                const request: ActivityRequest = {
                    name: updatedItem.name,
                    description: updatedItem.description,
                    icon: updatedItem.icon,
                    ruleset: updatedItem.ruleset ? JSON.parse(updatedItem.ruleset) : { enabled: true },
                    finishMessage: updatedItem.finishMessage ?? ""
                };
                result = await apiEditActivity(itemId, request, jwt);
            }
            
            if (!result.ok) {
                console.error("Failed to update item:", result.err);
                // Optionally revert the change or show error
            }
        } catch (err) {
            console.error("Error updating item:", err);
        }
    }

    // --- Drag & Drop Helpers ---

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
                const fromIdx = data.index;
                const newChapters = [...chapters];
                const [moved] = newChapters.splice(fromIdx, 1);
                newChapters.splice(targetIndex, 0, moved);
                
                // Update UI immediately
                setChapters(newChapters);
                
                // Send reorder to API
                const jwt = userSession?.jwt ?? "";
                const chapterIds = newChapters.map(c => c.id);
                const result = await apiReorderChapters(Number(courseId), chapterIds, jwt);
                
                if (!result.ok) {
                    console.error("Failed to reorder chapters:", result.err);
                    // Optionally revert the change
                    setChapters(chapters);
                }
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

        const item = chap.items.find(i => i.id === selection.itemId);
        if (!item) return null;

        return { type: 'item', data: item, chapter: chap };
    };

    const activeData = getSelectionData();

    // Show loading state
    if (loading) {
        return (
            <Page title={`Quark | Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faSpinner} className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                        <p className="text-slate-400">Loading course data...</p>
                    </div>
                </div>
            </Page>
        );
    }

    // Show error state
    if (error) {
        return (
            <Page title={`Quark | Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button 
                            onClick={() => navigate('/courses')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            Back to Courses
                        </button>
                    </div>
                </div>
            </Page>
        );
    }

    return (
        <Page title={`Quark | ${courseName} - Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
            {/* Main container - using transparent background to let Page background show through */}
            <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">

                {/* Background ambient effect */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-indigo-900/20 blur-[100px] pointer-events-none" />

                {/* Sidebar */}
                <aside className="w-80 flex flex-col border-r border-white/5 bg-slate-900/60 backdrop-blur-xl z-10">
                    <div className="p-6 pb-4">
                        <div className="flex items-center gap-3 text-slate-100 mb-6">
                            <FontAwesomeIcon icon={faLayerGroup} className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold tracking-tight">Chapter Editor</h2>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
                        {chapters.map((chapter, cIdx) => {
                            const isChapSelected = selection?.type === 'chapter' && selection.id === chapter.id;

                            return (
                                <div
                                    key={chapter.id}
                                    className="relative group/chapter animate-in slide-in-from-left-4 duration-300"
                                    style={{ animationDelay: `${cIdx * 50}ms`, animationFillMode: 'backwards' }}

                                    draggable
                                    onDragStart={(e) =>
                                        onDragStart(e, "chapter", { id: chapter.id, index: cIdx })
                                    }

                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => onDrop(e, chapter.id, cIdx)}
                                >

                                    {/* Delete Chapter Trigger (Hover Left) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeChapter(chapter.id); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-transparent hover:text-slate-300 opacity-0 group-hover/chapter:opacity-100 transition-all duration-200 z-20 hover:scale-110 hover:bg-white/5 rounded-full"
                                        title="Delete Chapter"
                                    >
                                        <FontAwesomeIcon icon={faTrash} style={{ width: 16, height: 16 }} />
                                    </button>

                                    {/* Chapter Header */}
                                    <div
                                        draggable
                                        onDragStart={(e) => onDragStart(e, 'chapter', { index: cIdx })}
                                        onClick={() => setSelection({ type: 'chapter', id: chapter.id })}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent
                                            ${isChapSelected
                                                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 shadow-lg shadow-indigo-900/20'
                                                : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/5'
                                            }
                                        `}
                                    >
                                        <FontAwesomeIcon icon={faCube} style={{ width: 16, height: 16 }} className={isChapSelected ? 'text-indigo-400' : 'opacity-70'} />
                                        <span className="font-medium text-sm truncate flex-1">{chapter.name}</span>
                                        <FontAwesomeIcon icon={faGripLinesVertical} style={{ width: 14, height: 14 }} className="opacity-0 group-hover/chapter:opacity-40 cursor-grab" />
                                    </div>

                                    {/* Items List */}
                                    <div className="mt-1 ml-4 pl-3 border-l border-white/5 space-y-0.5">
                                        {chapter.items.map((item, iIdx) => {
                                            const isItemSelected = selection?.type === 'item' && selection.itemId === item.id;

                                            return (
                                                <div
                                                    key={item.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, 'item', { chapterId: chapter.id, index: iIdx })}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => { e.stopPropagation(); onDrop(e, chapter.id, iIdx); }}
                                                    className="relative group/item"
                                                >
                                                    {/* Delete Item Trigger (Hover Left) */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeItemFromChapter(chapter.id, item.id); }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-transparent hover:text-slate-300 opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-20 hover:scale-110 hover:bg-white/5 rounded-full"
                                                        title="Delete Item"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} />
                                                    </button>

                                                    <div
                                                        onClick={() => setSelection({ type: 'item', chapterId: chapter.id, itemId: item.id })}
                                                        className={`
                                                            flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-sm transition-all duration-200 border border-transparent
                                                            ${isItemSelected
                                                                ? 'bg-blue-500/20 border-blue-500/20 text-blue-100 shadow-md shadow-blue-900/10 translate-x-1'
                                                                : 'hover:bg-white/5 text-slate-400 hover:text-slate-300'
                                                            }
                                                        `}
                                                    >
                                                        {item.itemType === 'ACTIVITY'
                                                            ? <FontAwesomeIcon icon={faFlask} style={{ width: 14, height: 14 }} className={isItemSelected ? 'text-blue-400' : 'opacity-70'} />
                                                            : <FontAwesomeIcon icon={faFileLines} style={{ width: 14, height: 14 }} className={isItemSelected ? 'text-blue-400' : 'opacity-70'} />
                                                        }
                                                        <span className="truncate flex-1">{item.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add Item Button */}
                                        <button
                                            onClick={() => openItemTypeModal(chapter.id)}
                                            className="group/btn text-xs text-slate-500 hover:text-blue-400 py-2 pl-2 flex items-center gap-2 transition-colors mt-1 w-full text-left"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-white/5 group-hover/btn:bg-blue-500/20 flex items-center justify-center transition-colors">
                                                <FontAwesomeIcon icon={faPlus} style={{ width: 12, height: 12 }} />
                                            </div>
                                            <span>Add Item</span>
                                        </button>

                                        {/* Drop Zone at bottom of list */}
                                        <div
                                            className="h-2 -my-1"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => onDrop(e, chapter.id, chapter.items.length)}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Chapter Button */}
                        <button
                            onClick={addChapter}
                            className="w-full py-4 border border-dashed border-white/10 rounded-xl text-slate-500 hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium mt-6 group"
                        >
                            <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                                <FontAwesomeIcon icon={faPlus} style={{ width: 14, height: 14 }} />
                            </div>
                            Add Chapter
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 bg-slate-950/30 backdrop-blur-sm p-8 overflow-y-auto relative custom-scrollbar">
                    {!activeData ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <FontAwesomeIcon icon={faMousePointer} style={{ width: 48, height: 48 }} className="mb-4 opacity-20" />
                            <p>Select a chapter or item to begin editing</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
                            {activeData.type === 'chapter' ? (
                                // --- Chapter Editor View ---
                                <div className="space-y-8">
                                    <div className="pb-6 border-b border-white/5">
                                        <div className="flex items-center gap-3 mb-4 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                            <span className="bg-blue-500/10 px-2 py-1 rounded">Chapter Settings</span>
                                        </div>
                                        <input
                                            className="w-full bg-transparent text-5xl font-bold text-white placeholder-slate-700 focus:outline-none focus:placeholder-slate-600 transition-colors"
                                            value={(activeData.data as Chapter).name}
                                            onChange={(e) => updateChapter((activeData.data as Chapter).id, { name: e.target.value })}
                                            placeholder="Chapter Name"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                            Description
                                        </label>
                                        <textarea
                                            className="w-full bg-slate-900/40 border border-white/10 rounded-xl p-6 text-slate-300 text-lg leading-relaxed focus:border-blue-500/40 focus:bg-slate-900/60 transition-all outline-none resize-none h-40 shadow-inner"
                                            value={(activeData.data as Chapter).description}
                                            onChange={(e) => updateChapter((activeData.data as Chapter).id, { description: e.target.value })}
                                            placeholder="Describe what students will learn in this chapter..."
                                        />
                                    </div>

                                    <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-2xl p-6 flex items-start gap-4">
                                        <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                                            <FontAwesomeIcon icon={faInfoCircle} style={{ width: 24, height: 24 }} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-indigo-100 mb-1">Quick Tip</h4>
                                            <p className="text-sm text-indigo-200/70 leading-relaxed">
                                                This chapter currently contains <span className="text-white font-medium">{(activeData.data as Chapter).items.length} items</span>.
                                                Drag and drop items in the sidebar to reorder them, or drag them between chapters to reorganize your course structure.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // --- Item Editor View ---
                                <div className="space-y-8">
                                    {/* Header Inputs */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                                            <span>{(activeData.chapter as Chapter).name}</span>
                                            <FontAwesomeIcon icon={faChevronRight} style={{ width: 14, height: 14 }} />
                                            <span className="text-blue-400">{(activeData.data as Item).name}</span>
                                        </div>

                                        <input
                                            className="w-full bg-transparent text-5xl font-bold text-white placeholder-slate-700 focus:outline-none transition-colors pb-2"
                                            value={(activeData.data as Item).name}
                                            onChange={(e) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { name: e.target.value })}
                                            placeholder="Item Title"
                                        />
                                        <input
                                            className="w-full bg-transparent text-2xl text-slate-400 placeholder-slate-700 focus:outline-none font-light"
                                            value={(activeData.data as Item).description || ''}
                                            onChange={(e) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { description: e.target.value })}
                                            placeholder="Add a description..."
                                        />
                                    </div>

                                    {/* Content Card */}
                                    <div className="bg-slate-50 rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 ring-4 ring-white/5">
                                        <div className="p-8 min-h-[400px]">
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-medium text-slate-600">Finish Message (Markdown/KaTeX)</label>
                                                        <button
                                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <FontAwesomeIcon icon={isPreviewMode ? faEdit : faEye} className="w-4 h-4" />
                                                            {isPreviewMode ? 'Edit' : 'Preview'}
                                                        </button>
                                                    </div>
                                                    {isPreviewMode ? (
                                                        <div className="w-full bg-white border border-slate-200 rounded-lg p-6 text-slate-800 min-h-[200px]">
                                                            <div className="prose max-w-none">
                                                                <PreviewRenderer value={(activeData.data as Item).finishMessage || ''} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="border border-slate-200 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                                                            <Editor
                                                                height="100%"
                                                                theme="light"
                                                                language="markdown"
                                                                value={(activeData.data as Item).finishMessage || ''}
                                                                onChange={(val) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { finishMessage: val ?? '' })}
                                                                options={{
                                                                    minimap: { enabled: false },
                                                                    lineNumbers: 'on',
                                                                    scrollBeyondLastLine: false,
                                                                    wordWrap: 'on',
                                                                    fontSize: 14,
                                                                    automaticLayout: true
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                {(activeData.data as Item).itemType === 'ACTIVITY' && (
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600 mb-2 block">
                                                            Ruleset (Activity Only) - JSON Format
                                                        </label>
                                                        <textarea
                                                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-slate-800 leading-relaxed placeholder-slate-400 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                                                            value={(() => {
                                                                const item = activeData.data as Item;
                                                                if (!item.ruleset) return '';
                                                                try {
                                                                    const parsed = typeof item.ruleset === 'string' 
                                                                        ? JSON.parse(item.ruleset) 
                                                                        : item.ruleset;
                                                                    return JSON.stringify(parsed, null, 2);
                                                                } catch {
                                                                    return item.ruleset;
                                                                }
                                                            })()}
                                                            onChange={(e) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { ruleset: e.target.value })}
                                                            placeholder='{\n  "enabled": true,\n  "closeDateTime": "2025-12-31T23:59:59",\n  "timeLimit": 3600\n}'
                                                            rows={8}
                                                        />
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Format: &#123;"enabled": true, "closeDateTime": "ISO date", "timeLimit": seconds&#125;
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center pb-12">
                                        <button className="px-6 py-3 rounded-full bg-slate-800/50 border border-white/10 hover:bg-slate-800 hover:border-white/20 text-slate-300 hover:text-white text-sm transition-all flex items-center gap-2 backdrop-blur-md shadow-lg">
                                            <FontAwesomeIcon icon={faPlus} style={{ width: 16, height: 16 }} /> Add Content Block
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Item Type Selection Modal */}
            {showItemTypeModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-bold text-white mb-2">Choose Item Type</h3>
                        <p className="text-slate-400 mb-6">Select the type of content you want to add to this chapter.</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => createItem("LESSON")}
                                className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faFileLines} className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-white mb-1">Lesson</div>
                                        <div className="text-sm text-slate-400">Traditional learning content with pages</div>
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => createItem("ACTIVITY")}
                                className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faFlask} className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-white mb-1">Activity</div>
                                        <div className="text-sm text-slate-400">Interactive exercises with sections</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                        
                        <button
                            onClick={() => {
                                setShowItemTypeModal(false);
                                setPendingChapterId(null);
                            }}
                            className="w-full mt-4 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>,
                document.body
            )}

        </Page>
    );
}