import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import type { Chapter } from "../types/ChapterEditorTypes";

interface ChapterEditorProps {
    chapter: Chapter;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
    chapter,
    onNameChange,
    onDescriptionChange,
}) => {
    return (
        <div className="space-y-8">
            {/* Chapter Name */}
            <div className="pb-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <span className="bg-blue-500/10 px-2 py-1 rounded">Chapter Settings</span>
                </div>
                <input
                    className="w-full bg-transparent text-5xl font-bold text-white placeholder-slate-700 focus:outline-none focus:placeholder-slate-600 transition-colors"
                    value={chapter.name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Chapter Name"
                />
            </div>

            {/* Chapter Description */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    Description
                </label>
                <textarea
                    className="w-full bg-slate-900/40 border border-white/10 rounded-xl p-6 text-slate-300 text-lg leading-relaxed focus:border-blue-500/40 focus:bg-slate-900/60 transition-all outline-none resize-none h-40 shadow-inner"
                    value={chapter.description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Describe what students will learn in this chapter..."
                />
            </div>

            {/* Quick Tip Box */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-indigo-500/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                    <FontAwesomeIcon icon={faInfoCircle} style={{ width: 24, height: 24 }} />
                </div>
                <div>
                    <h4 className="font-semibold text-indigo-100 mb-1">Quick Tip</h4>
                    <p className="text-sm text-indigo-200/70 leading-relaxed">
                        This chapter currently contains <span className="text-white font-medium">{chapter.items.length} items</span>.
                        Drag and drop items in the sidebar to reorder them, or drag them between chapters to reorganize your course structure.
                    </p>
                </div>
            </div>
        </div>
    );
};
