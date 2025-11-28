import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
    faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";

// --- Types ---
type Item = { 
    id: number; 
    title: string; 
    subtitle?: string;
    content?: string; 
    type?: 'doc' | 'lab'; 
};

type Chapter = { 
    id: number; 
    name: string; 
    description: string; 
    items: Item[] 
};

type Selection = { type: 'chapter'; id: number } | { type: 'item'; chapterId: number; itemId: number } | null;

// Using shared `Page` component from `src/components/page/Page.tsx`

// --- Main Application Component ---
export default function ChapterEditPage(): React.ReactElement {
    const { userSession, setUserSession } = loadSessionState();
    // Sample initial data matching the image
    const [chapters, setChapters] = useState<Chapter[]>(() => [
        { 
            id: 1, 
            name: "Chapter 1: Newton's Laws", 
            description: "Introduction to forces and motion.", 
            items: [
                { id: 1, title: "Introduction to Force", subtitle: "Defining Force", content: "Force is an interaction that, when unopposed, will change the motion of an object.", type: 'doc' },
                { id: 2, title: "Gravity Lab", subtitle: "Experimental data", content: "Analyze the acceleration due to gravity...", type: 'lab' }
            ] 
        },
        { 
            id: 2, 
            name: "Chapter 2: Thermodynamics", 
            description: "Heat, work and energy.", 
            items: [
                { id: 3, title: "Heat Transfer", subtitle: "Conduction, Convection, Radiation", content: "", type: 'doc' }
            ] 
        },
        { 
            id: 3, 
            name: "Chapter 3: Quantum Mechanics", 
            description: "Basic quantum concepts.", 
            items: [] 
        },
    ]);

    // Track detailed selection
    const [selection, setSelection] = useState<Selection>({ type: 'item', chapterId: 1, itemId: 1 });

    // ID counters
    const [nextChapterId, setNextChapterId] = useState(100);
    const [nextItemId, setNextItemId] = useState(1000);

    // Ensure something is selected on load
    useEffect(() => {
        if (!selection && chapters.length > 0) {
            if (chapters[0].items.length > 0) {
                setSelection({ type: 'item', chapterId: chapters[0].id, itemId: chapters[0].items[0].id });
            } else {
                setSelection({ type: 'chapter', id: chapters[0].id });
            }
        }
    }, [chapters, selection]);

    // --- Actions ---

    function addChapter() {
        const newChap: Chapter = { id: nextChapterId, name: `Chapter ${chapters.length + 1}: New Module`, description: "", items: [] };
        setNextChapterId(s => s + 1);
        setChapters(prev => [...prev, newChap]);
        setSelection({ type: 'chapter', id: newChap.id });
    }

    function removeChapter(id: number) {
        setChapters(prev => prev.filter(c => c.id !== id));
        if (selection?.type === 'chapter' && selection.id === id) {
            setSelection(null);
        }
    }

    function updateChapter(id: number, patch: Partial<Chapter>) {
        setChapters(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    }

    function addItemToChapter(chapterId: number) {
        const newItem: Item = { id: nextItemId, title: "New Item", subtitle: "Subtitle", content: "", type: 'doc' };
        setNextItemId(s => s + 1);
        setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, items: [...c.items, newItem] } : c));
        setSelection({ type: 'item', chapterId, itemId: newItem.id });
    }

    function removeItemFromChapter(chapterId: number, itemId: number) {
        setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
        if (selection?.type === 'item' && selection.itemId === itemId) {
            setSelection({ type: 'chapter', id: chapterId });
        }
    }

    function updateItem(chapterId: number, itemId: number, patch: Partial<Item>) {
        setChapters(prev => prev.map(c => c.id === chapterId ? { 
            ...c, 
            items: c.items.map(i => i.id === itemId ? { ...i, ...patch } : i) 
        } : c));
    }

    // --- Drag & Drop Helpers ---
    
    function onDragStart(e: React.DragEvent, type: 'chapter' | 'item', data: any) {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, ...data }));
        e.dataTransfer.effectAllowed = 'move';
    }

    function onDrop(e: React.DragEvent, targetChapterId: number, targetIndex?: number) {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;
        
        try {
            const data = JSON.parse(dataStr);
            
            // Reorder Chapters
            if (data.type === 'chapter' && typeof targetIndex === 'number') {
                const fromIdx = data.index;
                setChapters(prev => {
                    const copy = [...prev];
                    const [moved] = copy.splice(fromIdx, 1);
                    copy.splice(targetIndex, 0, moved);
                    return copy;
                });
            }

            // Reorder Items
            if (data.type === 'item') {
                const { chapterId: fromChapId, index: fromIdx } = data;
                
                setChapters(prev => {
                    const copy = prev.map(c => ({...c, items: [...c.items]}));
                    const sourceChap = copy.find(c => c.id === fromChapId);
                    const destChap = copy.find(c => c.id === targetChapterId);
                    
                    if (!sourceChap || !destChap) return prev;
                    
                    const [movedItem] = sourceChap.items.splice(fromIdx, 1);
                    
                    const finalIndex = targetIndex ?? destChap.items.length;
                    destChap.items.splice(finalIndex, 0, movedItem);
                    
                    return copy;
                });
            }
        } catch(e) {}
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

    return (
        <Page title={`Quark | Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
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
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => onDrop(e, chapter.id, 0)}
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
                                                        {item.type === 'lab' 
                                                            ? <FontAwesomeIcon icon={faFlask} style={{ width: 14, height: 14 }} className={isItemSelected ? 'text-blue-400' : 'opacity-70'} />
                                                                : <FontAwesomeIcon icon={faFileLines} style={{ width: 14, height: 14 }} className={isItemSelected ? 'text-blue-400' : 'opacity-70'} />
                                                        }
                                                        <span className="truncate flex-1">{item.title}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add Item Button */}
                                        <button 
                                            onClick={() => addItemToChapter(chapter.id)}
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
                                            <span className="text-blue-400">{(activeData.data as Item).title}</span>
                                        </div>

                                        <input 
                                            className="w-full bg-transparent text-5xl font-bold text-white placeholder-slate-700 focus:outline-none transition-colors pb-2"
                                            value={(activeData.data as Item).title}
                                            onChange={(e) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { title: e.target.value })}
                                            placeholder="Item Title"
                                        />
                                        <input 
                                            className="w-full bg-transparent text-2xl text-slate-400 placeholder-slate-700 focus:outline-none font-light"
                                            value={(activeData.data as Item).subtitle || ''}
                                            onChange={(e) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { subtitle: e.target.value })}
                                            placeholder="Add a subtitle..."
                                        />
                                    </div>

                                    {/* Content Card */}
                                    <div className="bg-slate-50 rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 ring-4 ring-white/5">
                                        <div className="p-8 min-h-[400px]">
                                            <textarea 
                                                className="w-full h-full bg-transparent resize-none outline-none text-lg text-slate-800 leading-relaxed placeholder-slate-300 font-medium"
                                                value={(activeData.data as Item).content || ''}
                                                onChange={(e) => updateItem((activeData.chapter as Chapter).id, (activeData.data as Item).id, { content: e.target.value })}
                                                placeholder="Start typing your content here..."
                                                style={{ minHeight: '300px' }}
                                            />
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
            
        </Page>
    );
}