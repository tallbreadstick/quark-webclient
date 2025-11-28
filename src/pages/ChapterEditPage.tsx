import React, { useEffect, useState } from "react";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";

type Item = { id: number; title: string };
type Chapter = { id: number; name: string; description: string; items: Item[] };

export default function ChapterEditPage(): React.ReactElement {
    const { userSession } = loadSessionState();
    // sample initial data
    const [chapters, setChapters] = useState<Chapter[]>(() => [
        { id: 1, name: "Module 1: Newton's Laws", description: "Introduction to forces and motion.", items: [
            { id: 1, title: "Introduction to Force" },
            { id: 2, title: "Gravity Lab" }
        ] },
        { id: 2, name: "Module 2: Thermodynamics", description: "Heat, work and energy.", items: [] },
        { id: 3, name: "Module 3: Quantum Mechanics", description: "Basic quantum concepts.", items: [] },
    ]);

    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(chapters[0]?.id ?? null);

    // simple id counters for new chapters/items
    const [nextChapterId, setNextChapterId] = useState(100);
    const [nextItemId, setNextItemId] = useState(1000);

    // drag state for chapters and items
    useEffect(() => {
        if (selectedChapterId === null && chapters.length > 0) setSelectedChapterId(chapters[0].id);
    }, [chapters, selectedChapterId]);

    // --- Chapter operations ---
    function addChapter() {
        const newChap: Chapter = { id: nextChapterId, name: "New Chapter", description: "", items: [] };
        setNextChapterId((s) => s + 1);
        setChapters((prev) => [...prev, newChap]);
        setSelectedChapterId(newChap.id);
    }

    function removeChapter(id: number) {
        setChapters((prev) => prev.filter((c) => c.id !== id));
        if (selectedChapterId === id) setSelectedChapterId((prev) => {
            const remaining = chapters.filter((c) => c.id !== id);
            return remaining[0]?.id ?? null;
        });
    }

    function updateChapter(id: number, patch: Partial<Chapter>) {
        setChapters((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
    }

    function reorderChapters(fromIndex: number, toIndex: number) {
        setChapters((prev) => {
            const copy = [...prev];
            const [moved] = copy.splice(fromIndex, 1);
            copy.splice(toIndex, 0, moved);
            return copy;
        });
    }

    // --- Item operations ---
    function addItemToChapter(chapterId: number) {
        const newItem: Item = { id: nextItemId, title: "New Item" };
        setNextItemId((s) => s + 1);
        setChapters((prev) => prev.map((c) => c.id === chapterId ? { ...c, items: [...c.items, newItem] } : c));
    }

    function removeItemFromChapter(chapterId: number, itemId: number) {
        setChapters((prev) => prev.map((c) => c.id === chapterId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
    }

    function updateItemTitle(chapterId: number, itemId: number, title: string) {
        setChapters((prev) => prev.map((c) => c.id === chapterId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, title } : i) } : c));
    }

    function reorderItems(chapterId: number, fromIdx: number, toIdx: number) {
        setChapters((prev) => prev.map((c) => {
            if (c.id !== chapterId) return c;
            const copy = [...c.items];
            const [moved] = copy.splice(fromIdx, 1);
            copy.splice(toIdx, 0, moved);
            return { ...c, items: copy };
        }));
    }

    // --- Drag & drop (HTML5) ---
    function onChapterDragStart(e: React.DragEvent, index: number) {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'chapter', from: index }));
        e.dataTransfer.effectAllowed = 'move';
    }

    function onChapterDrop(e: React.DragEvent, toIndex: number) {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'chapter') {
                reorderChapters(parsed.from, toIndex);
            }
        } catch { }
    }

    function onItemDragStart(e: React.DragEvent, chapterId: number, itemIndex: number) {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'item', chapterId, from: itemIndex }));
        e.dataTransfer.effectAllowed = 'move';
    }

    function onItemDrop(e: React.DragEvent, chapterId: number, toIndex: number) {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'item') {
                const fromChapterId = parsed.chapterId;
                const fromIndex = parsed.from;
                if (fromChapterId === chapterId) {
                    reorderItems(chapterId, fromIndex, toIndex);
                } else {
                    // move between chapters
                    setChapters((prev) => {
                        const copy = prev.map(c => ({ ...c, items: [...c.items] }));
                        const fromChap = copy.find(c => c.id === fromChapterId);
                        const toChap = copy.find(c => c.id === chapterId);
                        if (!fromChap || !toChap) return prev;
                        const [moved] = fromChap.items.splice(fromIndex, 1);
                        toChap.items.splice(toIndex, 0, moved);
                        return copy;
                    });
                }
            }
        } catch { }
    }

    function allowDrop(e: React.DragEvent) { e.preventDefault(); }

    const selectedChapter = chapters.find(c => c.id === selectedChapterId) ?? null;

    return (
        <Page title="Quark | Edit Chapters" userSession={userSession} setUserSession={() => {}}>
            <div className="min-h-[calc(100vh-4rem)] flex bg-slate-900 text-white">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold">Chapters</div>
                    <button onClick={addChapter} className="text-sm px-2 py-1 bg-blue-600 rounded flex items-center gap-2">
                        {/* UPDATE: Ensure Add icon is plus */}
                        <i className="fa fa-plus" aria-hidden="true" />
                        <span>Add Chapter</span>
                    </button>
                </div>

                <div className="space-y-2">
                    {chapters.map((chapter, idx) => (
                        <div
                            key={chapter.id}
                            draggable
                            onDragStart={(e) => onChapterDragStart(e, idx)}
                            onDragOver={allowDrop}
                            onDrop={(e) => onChapterDrop(e, idx)}
                            onClick={() => setSelectedChapterId(chapter.id)}
                            className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${selectedChapterId === chapter.id ? 'bg-white/6' : 'bg-black/20'} border border-white/5`}
                        >
                            <div>
                                <div className="font-medium">{chapter.name}</div>
                                <div className="text-xs text-gray-300">{chapter.description || 'No description'}</div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <button title="Delete chapter" onClick={(ev) => { ev.stopPropagation(); removeChapter(chapter.id); }} className="text-sm px-2 py-1 bg-red-600 rounded" aria-label="Delete chapter">
                                    {/* UPDATE: Change delete icon from times (X) to minus */}
                                    <i className="fa fa-minus" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main panel */}
            <main className="flex-1 p-6">
                {!selectedChapter && (
                    <div className="text-gray-300">Select or add a chapter from the left to begin.</div>
                )}

                {selectedChapter && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <input
                                    value={selectedChapter.name}
                                    onChange={(e) => updateChapter(selectedChapter.id, { name: e.target.value })}
                                    className="text-2xl font-semibold bg-transparent border-b border-white/10 pb-2"
                                />
                                <textarea
                                    value={selectedChapter.description}
                                    onChange={(e) => updateChapter(selectedChapter.id, { description: e.target.value })}
                                    placeholder="Chapter description"
                                    className="w-full mt-2 bg-transparent text-sm text-gray-200 border border-white/5 p-3 rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { addItemToChapter(selectedChapter.id); }} className="px-4 py-2 bg-green-600 rounded flex items-center gap-2">
                                    {/* UPDATE: Ensure Add icon is plus */}
                                    <i className="fa fa-plus" aria-hidden="true" />
                                    <span>Add Item</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-2">Items</h3>
                            <div className="space-y-2">
                                {selectedChapter.items.map((item, idx) => (
                                    <div key={item.id}
                                        draggable
                                        onDragStart={(e) => onItemDragStart(e, selectedChapter.id, idx)}
                                        onDragOver={allowDrop}
                                        onDrop={(e) => onItemDrop(e, selectedChapter.id, idx)}
                                        className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5"
                                    >
                                        <input className="bg-transparent flex-1" value={item.title} onChange={(e) => updateItemTitle(selectedChapter.id, item.id, e.target.value)} />
                                        <div className="flex gap-2 ml-4">
                                            <button onClick={() => removeItemFromChapter(selectedChapter.id, item.id)} className="px-2 py-1 bg-red-600 rounded" aria-label="Delete item">
                                                {/* UPDATE: Change delete icon from times (X) to minus */}
                                                <i className="fa fa-minus" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* drop area to append to end */}
                                <div onDragOver={allowDrop} onDrop={(e) => onItemDrop(e, selectedChapter.id, selectedChapter.items.length)} className="h-6" />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
        </Page>
    );
}