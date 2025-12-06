import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrash,
    faPlus,
    faFileLines,
    faFlask,
    faGripLinesVertical,
    faCube,
    faLayerGroup,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import type { Chapter, Selection } from "../types/ChapterEditorTypes";

interface ChapterSidebarProps {
    courseId: string | undefined;
    chapters: Chapter[];
    selection: Selection;
    onSelectionChange: (selection: Selection) => void;
    onAddChapter: () => void;
    onRemoveChapter: (chapterId: number) => void;
    onOpenItemTypeModal: (chapterId: number) => void;
    onRemoveItem: (chapterId: number, itemId: number) => void;
    onDragStart: (e: React.DragEvent, type: 'chapter' | 'item', data: any) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetChapterId: number, targetIndex?: number) => void;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
    courseId,
    chapters,
    selection,
    onSelectionChange,
    onAddChapter,
    onRemoveChapter,
    onOpenItemTypeModal,
    onRemoveItem,
    onDragStart,
    onDragOver,
    onDrop,
}) => {
    const navigate = useNavigate();

    return (
        <aside className="w-80 flex flex-col border-r border-white/5 bg-slate-900/60 backdrop-blur-xl z-10">
            {/* Header */}
            <div className="p-6 pb-4">
                <button
                    onClick={() => navigate(`/course/${courseId}/edit`)}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-4 text-sm group"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Edit Course</span>
                </button>
                <div className="flex items-center gap-3 text-slate-100 mb-6">
                    <FontAwesomeIcon icon={faLayerGroup} className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-bold tracking-tight">Chapter Editor</h2>
                </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
                {chapters.map((chapter, cIdx) => {
                    const isChapSelected = selection?.type === 'chapter' && selection.id === chapter.id;

                    return (
                        <div
                            key={chapter.id}
                            className="relative group/chapter animate-in slide-in-from-left-4 duration-300"
                            style={{ animationDelay: `${cIdx * 50}ms`, animationFillMode: 'backwards' }}
                            draggable
                            onDragStart={(e) => onDragStart(e, "chapter", { id: chapter.id, index: cIdx })}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, chapter.id, cIdx)}
                        >
                            {/* Chapter Header */}
                            <div
                                draggable
                                onDragStart={(e) => onDragStart(e, 'chapter', { index: cIdx })}
                                onClick={() => onSelectionChange({ type: 'chapter', id: chapter.id })}
                                className={`relative
                                    flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent
                                    ${isChapSelected
                                        ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 shadow-lg shadow-indigo-900/20'
                                        : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/5'
                                    }
                                `}
                            >
                                {/* Delete Chapter Trigger */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveChapter(chapter.id); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-transparent hover:text-slate-300 opacity-0 group-hover/chapter:opacity-100 transition-all duration-200 z-20 hover:scale-110 hover:bg-white/5 rounded-full"
                                    title="Delete Chapter"
                                >
                                    <FontAwesomeIcon icon={faTrash} style={{ width: 16, height: 16 }} />
                                </button>
                                <FontAwesomeIcon icon={faCube} style={{ width: 16, height: 16 }} className={isChapSelected ? 'text-indigo-400' : 'opacity-70'} />
                                <span className="font-medium text-sm truncate flex-1">{chapter.name}</span>
                                <FontAwesomeIcon icon={faGripLinesVertical} style={{ width: 14, height: 14 }} className="opacity-0 group-hover/chapter:opacity-40 cursor-grab" />
                            </div>

                            {/* Items List */}
                            <div className="mt-1 ml-4 pl-3 border-l border-white/5 space-y-0.5">
                                {chapter.items.map((item, iIdx) => {
                                    const isItemSelected = selection?.type === 'item' && selection.chapterId === chapter.id && selection.serialId === item.uiSerialId;

                                    return (
                                        <div
                                            key={`${chapter.id}-${item.id ?? 'na'}-${iIdx}`}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, 'item', { chapterId: chapter.id, index: iIdx })}
                                            onDragOver={onDragOver}
                                            onDrop={(e) => { e.stopPropagation(); onDrop(e, chapter.id, iIdx); }}
                                            className="relative group/item"
                                        >
                                            {/* Delete Item Trigger */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(chapter.id, item.id); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-transparent hover:text-slate-300 opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-20 hover:scale-110 hover:bg-white/5 rounded-full"
                                                title="Delete Item"
                                            >
                                                <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} />
                                            </button>

                                            <div
                                                onClick={() => onSelectionChange({ type: 'item', chapterId: chapter.id, serialId: item.uiSerialId! })}
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
                                    onClick={() => onOpenItemTypeModal(chapter.id)}
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
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, chapter.id, chapter.items.length)}
                                />
                            </div>
                        </div>
                    );
                })}

                {/* Add Chapter Button */}
                <button
                    onClick={onAddChapter}
                    className="w-full py-4 border border-dashed border-white/10 rounded-xl text-slate-500 hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium mt-6 group"
                >
                    <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                        <FontAwesomeIcon icon={faPlus} style={{ width: 14, height: 14 }} />
                    </div>
                    Add Chapter
                </button>
            </div>
        </aside>
    );
};
