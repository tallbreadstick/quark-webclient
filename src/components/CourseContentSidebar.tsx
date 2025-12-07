import React from "react";
import type { Chapter, Item } from "../types/CourseContentTypes";

type CourseContentSidebarProps = {
    courseName: string;
    userProgress: number | null;
    chapters: Chapter[];
    selectedChapterIndex: number;
    selectedItemIndex: number;
    loading: boolean;
    error: string | null;
    onSelectChapter: (index: number) => void;
    onSelectItem: (chapterIndex: number, itemIndex: number) => void;
};

export function CourseContentSidebar({
    courseName,
    userProgress,
    chapters,
    selectedChapterIndex,
    selectedItemIndex,
    loading,
    error,
    onSelectChapter,
    onSelectItem,
}: CourseContentSidebarProps): React.ReactElement {
    return (
        <aside className="col-span-12 lg:col-span-3">
            {/* Progress Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <h3 className="text-sm text-gray-400">{courseName}</h3>
                <div className="mt-3">
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-[#3b82f6] h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.round((userProgress ?? 0) * 100)}%` }} 
                        />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        {userProgress == null ? '—' : `${Math.round((userProgress ?? 0) * 100)}%`} Complete
                    </div>
                </div>
            </div>

            {/* Course Contents Navigation */}
            <nav className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <h4 className="text-sm text-gray-400 mb-2">Course Contents</h4>
                <ul className="space-y-2">
                    {loading && <li className="text-sm text-gray-400">Loading...</li>}
                    {error && <li className="text-sm text-red-400">{error}</li>}
                    {chapters && chapters.length === 0 && <li className="text-sm text-gray-400">No chapters yet.</li>}
                    {chapters && chapters.map((ch, ci) => (
                        <li key={ch.id}>
                            <button
                                onClick={() => onSelectChapter(ci)}
                                className={`w-full text-left px-3 py-2 rounded-md transition ${
                                    ci === selectedChapterIndex ? 'bg-white/7' : 'hover:bg-white/3'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-white truncate">{ch.name}</div>
                                        <div className="text-xs text-gray-400">
                                            {ch.items?.length ?? 0} {ch.items?.length === 1 ? 'item' : 'items'}
                                        </div>
                                    </div>
                                    {ch.number && <div className="text-xs text-gray-400">{ch.number}</div>}
                                </div>
                            </button>

                            {/* Items list, visible when chapter is selected */}
                            {ci === selectedChapterIndex && ch.items && ch.items.length > 0 && (
                                <ul className="mt-2 ml-4 space-y-1">
                                    {ch.items.map((item, ii) => (
                                        <li key={item.id}>
                                            <button 
                                                onClick={() => onSelectItem(ci, ii)} 
                                                className={`w-full text-left px-2 py-1 rounded-md text-sm transition ${
                                                    ii === selectedItemIndex 
                                                        ? 'bg-[#3b82f6] text-white' 
                                                        : 'text-gray-300 hover:bg-white/3'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {item.type === "ACTIVITY" && (
                                                        <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                                                            Activity
                                                        </span>
                                                    )}
                                                    {item.type === "LESSON" && (
                                                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                                                            Lesson
                                                        </span>
                                                    )}
                                                    <span className="truncate">{item.name}</span>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
