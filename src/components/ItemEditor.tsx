import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faEye, faEdit, faQuestion } from '@fortawesome/free-solid-svg-icons';
import Editor from "@monaco-editor/react";
import PreviewRenderer from "./PreviewRenderer";
import type { Chapter, Item } from "../types/ChapterEditorTypes";
import { ActivityRuleset } from "./ActivityRuleset";
import { fetchActivity } from "../endpoints/ActivityHandler";
import { loadSessionState } from "../types/UserSession";

interface ItemEditorProps {
    item: Item;
    chapter: Chapter;
    isPreviewMode: boolean;
    timeLimitEnabledMap: Record<string, boolean>;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onFinishMessageChange: (message: string) => void;
    onTimeLimitEnabledChange: (serialKey: string, enabled: boolean) => void;
    onRulesetFieldUpdate: (field: string, value: any) => void;
    onPreviewModeToggle: () => void;
}

export const ItemEditor: React.FC<ItemEditorProps> = ({
    item,
    chapter,
    isPreviewMode,
    timeLimitEnabledMap,
    onNameChange,
    onDescriptionChange,
    onFinishMessageChange,
    onTimeLimitEnabledChange,
    onRulesetFieldUpdate,
    onPreviewModeToggle,
}) => {
    const navigate = useNavigate();
    const { userSession } = loadSessionState();

    const handleOpenEditPage = () => {
        if (item.itemType === "LESSON" && item.id) {
            navigate(`/lesson/${item.id}/edit`);
            return;
        }
        if (item.itemType === "ACTIVITY" && item.id) {
            (async () => {
                try {
                    const jwt = userSession?.jwt ?? "";
                    const res = await fetchActivity(item.id, jwt);
                    if (res.ok) {
                        const ids = res.ok.sections.map(s => s.id).join(",");
                        navigate(`/activity/${item.id}|${ids}/edit`);
                        
                        return;
                    }
                } catch (e) {
                    console.error("Failed fetch activity for edit route", e);
                }

                // fallback: navigate to activity edit route without section ids
                navigate(`/activity/${item.id}/edit`);
                
            })();
        }
    };
    return (
        <div className="space-y-8">
            {/* Header Inputs */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                    <span>{chapter.name}</span>
                    <FontAwesomeIcon icon={faChevronRight} style={{ width: 14, height: 14 }} />
                    <span className="text-blue-400">{item.name}</span>
                </div>

                <input
                    className="w-full bg-transparent text-5xl font-bold text-white placeholder-slate-700 focus:outline-none transition-colors pb-2"
                    value={item.name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Item Title"
                />
                <input
                    className="w-full bg-transparent text-2xl text-slate-400 placeholder-slate-700 focus:outline-none font-light"
                    value={item.description || ''}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Add a description..."
                />
            </div>

            {/* Content Card */}
            <div className="space-y-6">
                {/* Activity Ruleset (only for activities) */}
                {item.itemType === 'ACTIVITY' && (
                    <ActivityRuleset
                        item={item}
                        timeLimitEnabledMap={timeLimitEnabledMap}
                        onTimeLimitEnabledChange={onTimeLimitEnabledChange}
                        onRulesetFieldUpdate={onRulesetFieldUpdate}
                    />
                )}

                {/* Finish Message */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-slate-400">Finish Message (Markdown/KaTeX)</label>
                        <div className="flex items-center gap-2">
                            <a
                                href="https://ashki23.github.io/markdown-latex.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                                title="Markdown & LaTeX Guide"
                            >
                                <FontAwesomeIcon icon={faQuestion} className="w-4 h-4" />
                            </a>
                            <button
                                onClick={onPreviewModeToggle}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                <FontAwesomeIcon icon={isPreviewMode ? faEdit : faEye} className="w-4 h-4" />
                                {isPreviewMode ? 'Edit' : 'Preview'}
                            </button>
                        </div>
                    </div>
                    {isPreviewMode ? (
                        <div className="w-full bg-white border border-gray-200 rounded-lg p-6 text-slate-900 min-h-[200px]">
                            <div className="prose max-w-none">
                                <PreviewRenderer value={item.finishMessage || ''} />
                            </div>
                        </div>
                    ) : (
                        <div className="border border-white/10 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                language="markdown"
                                value={item.finishMessage || ''}
                                onChange={(val) => onFinishMessageChange(val ?? '')}
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
            </div>

            {/* Footer Button */}
            <div className="flex justify-center pb-12">
                <button
                    className="px-6 py-3 rounded-full bg-slate-800/50 border border-white/10 hover:bg-slate-800 hover:border-white/20 text-slate-300 hover:text-white text-sm transition-all flex items-center gap-2 backdrop-blur-md shadow-lg"
                    onClick={handleOpenEditPage}
                >
                    Open In Edit Page
                </button>
            </div>
        </div>
    );
};
