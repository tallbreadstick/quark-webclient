import React from "react";
import type { Item } from "../types/CourseContentTypes";

type LessonViewerProps = {
    lesson: Item;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
};

export function LessonViewer({
    lesson,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
}: LessonViewerProps): React.ReactElement {
    return (
        <div className="space-y-6">
            {/* Lesson Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Lesson</span>
                        <h1 className="text-2xl font-bold text-white">{lesson.name}</h1>
                    </div>
                    {lesson.description && (
                        <p className="text-gray-400 mt-2">{lesson.description}</p>
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

            {/* Lesson Content */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="prose prose-invert max-w-none">
                    {/* Display pages if available */}
                    {lesson.pages && lesson.pages.length > 0 ? (
                        <div className="space-y-4">
                            {lesson.pages.map((page, index) => (
                                <div key={page.id} className="bg-white/5 rounded-xl p-4">
                                    {page.number && (
                                        <div className="text-xs text-gray-400 mb-2">Page {page.number}</div>
                                    )}
                                    {page.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: page.content }} />
                                    ) : (
                                        <div className="text-gray-400">No content available</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : lesson.finishMessage ? (
                        <div className="text-gray-200">{lesson.finishMessage}</div>
                    ) : (
                        <div className="text-gray-400">Content coming soon.</div>
                    )}
                </div>
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
