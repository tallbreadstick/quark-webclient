import React, { Suspense } from "react";
import type { ItemSection } from "../types/CourseContentTypes";

type PreviewProps = {
    value: string;
};

type Props = {
    section: ItemSection;
    PreviewRenderer: React.ComponentType<PreviewProps>;
};

export default function ActivityMcqSection({ section, PreviewRenderer }: Props) {
    if (!section.mcq) return null;

    return (
        <div className="space-y-6">
            <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-gray-200">
                <Suspense fallback={<div className="text-gray-400">Loading instructions...</div>}>
                    <PreviewRenderer value={section.mcq.instructions} />
                </Suspense>
            </div>

            <div className="space-y-6 mt-8">
                {section.mcq.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-medium text-white">Question {qIdx + 1}</h4>
                            <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-sm text-yellow-400">
                                {q.points} {q.points === 1 ? "point" : "points"}
                            </span>
                        </div>
                        <p className="text-gray-200 mb-4">{q.question}</p>
                        <div className="space-y-2">
                            {q.choices.map((choice, cIdx) => (
                                <div
                                    key={cIdx}
                                    className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition cursor-pointer"
                                >
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${qIdx}`}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-gray-300">{choice}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
