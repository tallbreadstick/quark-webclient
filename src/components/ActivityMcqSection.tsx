import React, { Suspense, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import type { Item, ItemSection, Question } from "../types/CourseContentTypes";

type PreviewProps = {
    value: string;
};

type Props = {
    item: Item;
    section: ItemSection;
    PreviewRenderer: React.ComponentType<PreviewProps>;
};

interface ValidationResult {
    success: boolean;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    pointsEarned: number;
    maxPoints: number;
    scorePercentage: number;
    questionResults: Array<{
        questionIdx: number;
        question: string;
        correct: boolean;
        userAnswer: string;
        correctAnswer: string;
        points: number;
        pointsEarned: number;
    }>;
}

export default function ActivityMcqSection({ item, section, PreviewRenderer }: Props) {
    if (!section.mcq) return null;

    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnswerChange = (questionIdx: number, choice: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionIdx]: choice,
        }));
    };

    const handleSubmit = () => {
        // Validate all questions are answered
        if (Object.keys(selectedAnswers).length !== section.mcq!.questions.length) {
            setError("Please answer all questions before submitting.");
            return;
        }

        setError(null);

        // Calculate results
        const questions = section.mcq!.questions;
        let correctAnswers = 0;
        let pointsEarned = 0;
        let maxPoints = 0;

        const questionResults = questions.map((q: Question, qIdx: number) => {
            const userAnswer = selectedAnswers[qIdx];
            const isCorrect = userAnswer === q.correct;
            const points = q.points;
            const earned = isCorrect ? points : 0;

            if (isCorrect) correctAnswers++;
            pointsEarned += earned;
            maxPoints += points;

            return {
                questionIdx: qIdx,
                question: q.question,
                correct: isCorrect,
                userAnswer,
                correctAnswer: q.correct,
                points,
                pointsEarned: earned,
            };
        });

        const scorePercentage = maxPoints > 0 ? (pointsEarned / maxPoints) * 100 : 0;
        const success = scorePercentage === 100;

        setValidationResult({
            success,
            totalQuestions: questions.length,
            correctAnswers,
            incorrectAnswers: questions.length - correctAnswers,
            pointsEarned,
            maxPoints,
            scorePercentage,
            questionResults,
        });
    };

    if (validationResult) {
        const scorePercentage = validationResult.scorePercentage;
        const passed = scorePercentage >= 70;

        return (
            <div className="space-y-6">
                {/* Results Summary */}
                <div className={`p-6 rounded-lg border ${passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <FontAwesomeIcon
                            icon={passed ? faCheckCircle : faTimesCircle}
                            className={`text-2xl ${passed ? "text-green-400" : "text-red-400"}`}
                        />
                        <h3 className={`text-xl font-bold ${passed ? "text-green-300" : "text-red-300"}`}>
                            {passed ? "Great Job!" : "Try Again"}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Score</p>
                            <p className="text-2xl font-bold text-white">{scorePercentage.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Points</p>
                            <p className="text-2xl font-bold text-white">
                                {validationResult.pointsEarned} / {validationResult.maxPoints}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Correct</p>
                            <p className="text-lg font-semibold text-green-400">{validationResult.correctAnswers}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Incorrect</p>
                            <p className="text-lg font-semibold text-red-400">{validationResult.incorrectAnswers}</p>
                        </div>
                    </div>
                </div>

                {/* Question Results */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Review Answers</h4>
                    {validationResult.questionResults.map((result, idx: number) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                                result.correct ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-white">Question {idx + 1}</h5>
                                <FontAwesomeIcon
                                    icon={result.correct ? faCheckCircle : faTimesCircle}
                                    className={result.correct ? "text-green-400" : "text-red-400"}
                                />
                            </div>
                            <p className="text-gray-300 text-sm mb-3">{result.question}</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-gray-400">
                                    Your answer: <span className="text-gray-200 font-medium">{result.userAnswer}</span>
                                </p>
                                {!result.correct && (
                                    <p className="text-gray-400">
                                        Correct answer: <span className="text-green-400 font-medium">{result.correctAnswer}</span>
                                    </p>
                                )}
                                <p className="text-gray-400">
                                    Points: <span className={`font-medium ${result.pointsEarned > 0 ? "text-green-400" : "text-red-400"}`}>
                                        {result.pointsEarned} / {result.points}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="prose prose-lg max-w-none prose-invert prose-headings:text-white prose-p:text-gray-200">
                <Suspense fallback={<div className="text-gray-400">Loading instructions...</div>}>
                    <PreviewRenderer value={section.mcq.instructions} />
                </Suspense>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-6 mt-8">
                {section.mcq.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-medium text-white">Question {qIdx + 1}</h4>
                            <span className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-sm text-violet-400">
                                {q.points} {q.points === 1 ? "point" : "points"}
                            </span>
                        </div>
                        <p className="text-gray-200 mb-4">{q.question}</p>
                        <div className="space-y-2">
                            {q.choices.map((choice, cIdx) => (
                                <div
                                    key={cIdx}
                                    className={`p-3 border rounded-lg transition cursor-pointer ${
                                        selectedAnswers[qIdx] === choice
                                            ? "bg-blue-500/20 border-blue-500/50"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    }`}
                                    onClick={() => handleAnswerChange(qIdx, choice)}
                                >
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${qIdx}`}
                                            checked={selectedAnswers[qIdx] === choice}
                                            onChange={() => handleAnswerChange(qIdx, choice)}
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

            {/* Submit Button */}
            <div className="flex gap-3 mt-8">
                <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium cursor-pointer"
                >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Submit Answers
                </button>
            </div>
        </div>
    );
}
