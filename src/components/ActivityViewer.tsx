import React from "react";
import type { Item } from "../types/CourseContentTypes";

type ActivityViewerProps = {
    activity: Item;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
};

type Ruleset = {
    enabled: boolean;
    allowReview?: boolean;
    allowRetake?: boolean;
    passingScore?: number;
    timeLimit?: number;
    dueDate?: string;
    attempts?: number;
    randomizeQuestions?: boolean;
    randomizeAnswers?: boolean;
};

export function ActivityViewer({
    activity,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
}: ActivityViewerProps): React.ReactElement {
    // Parse ruleset if available
    let ruleset: Ruleset | null = null;
    try {
        if (activity.ruleset) {
            ruleset = typeof activity.ruleset === 'string' 
                ? JSON.parse(activity.ruleset) 
                : activity.ruleset;
        }
    } catch (e) {
        console.error("Failed to parse activity ruleset:", e);
    }

    return (
        <div className="space-y-6">
            {/* Activity Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Activity</span>
                        <h1 className="text-2xl font-bold text-white">{activity.name}</h1>
                    </div>
                    {activity.description && (
                        <p className="text-gray-400 mt-2">{activity.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={onPrevious} 
                        disabled={!hasPrevious}
                        className="px-3 py-2 bg-white/5 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={onNext}
                        disabled={!hasNext}
                        className="px-3 py-2 bg-[#3b82f6] rounded-md text-white hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Activity Rules/Settings */}
            {ruleset && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Activity Settings</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {ruleset.timeLimit && (
                            <div>
                                <span className="text-gray-400">Time Limit:</span>
                                <span className="text-white ml-2">{ruleset.timeLimit} minutes</span>
                            </div>
                        )}
                        {ruleset.passingScore !== undefined && (
                            <div>
                                <span className="text-gray-400">Passing Score:</span>
                                <span className="text-white ml-2">{ruleset.passingScore}%</span>
                            </div>
                        )}
                        {ruleset.attempts !== undefined && (
                            <div>
                                <span className="text-gray-400">Attempts Allowed:</span>
                                <span className="text-white ml-2">{ruleset.attempts}</span>
                            </div>
                        )}
                        {ruleset.dueDate && (
                            <div>
                                <span className="text-gray-400">Due Date:</span>
                                <span className="text-white ml-2">{new Date(ruleset.dueDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {ruleset.allowReview !== undefined && (
                            <div>
                                <span className="text-gray-400">Review Allowed:</span>
                                <span className="text-white ml-2">{ruleset.allowReview ? 'Yes' : 'No'}</span>
                            </div>
                        )}
                        {ruleset.allowRetake !== undefined && (
                            <div>
                                <span className="text-gray-400">Retake Allowed:</span>
                                <span className="text-white ml-2">{ruleset.allowRetake ? 'Yes' : 'No'}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Activity Content Placeholder */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Activity Content</h3>
                    <p className="text-gray-400 mb-6">
                        Activity scoring, time deduction, and interactive features will be implemented here.
                    </p>
                    {activity.pages && activity.pages.length > 0 ? (
                        <div className="space-y-4 mt-6">
                            {activity.pages.map((page) => (
                                <div key={page.id} className="bg-white/5 rounded-xl p-4 text-left">
                                    {page.number && (
                                        <div className="text-xs text-gray-400 mb-2">Question {page.number}</div>
                                    )}
                                    {page.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: page.content }} />
                                    ) : (
                                        <div className="text-gray-400">No content available</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 italic">No activity questions available yet.</div>
                    )}
                </div>

                {/* Finish Message */}
                {activity.finishMessage && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Completion Message</h4>
                        <p className="text-gray-300 text-sm">{activity.finishMessage}</p>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-4">
                <button 
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className="px-4 py-2 bg-white/5 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    ← Previous
                </button>
                <button 
                    onClick={onNext}
                    disabled={!hasNext}
                    className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
