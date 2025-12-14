import React, { Suspense, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPaperPlane, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import Editor from "@monaco-editor/react";
import type { Item, ItemSection } from "../types/CourseContentTypes";
import { runCode, submitCode, type CodeSubmissionRequest, type CodeExecutionResponse } from "../endpoints/CodeExecutionHandler";
import { loadSessionState } from "../types/UserSession";

type PreviewProps = {
    value: string;
};

type Props = {
    item: Item;
    section: ItemSection;
    sectionIndex: number;
    codeValue: string;
    onCodeChange: (value: string) => void;
    selectedTestCase: number;
    onSelectTestCase: (index: number) => void;
    testResults: string | null;
    isRunning: boolean;
    onRun: () => void;
    onSubmit: () => void;
    PreviewRenderer: React.ComponentType<PreviewProps>;
};

export default function ActivityCodeLayout({
    item,
    section,
    sectionIndex,
    codeValue,
    onCodeChange,
    selectedTestCase,
    onSelectTestCase,
    testResults,
    isRunning,
    onRun,
    onSubmit,
    PreviewRenderer,
}: Props) {
    const testCases = section.code?.testCases || [];
    const { userSession } = loadSessionState();
    const [isRunningLocal, setIsRunningLocal] = useState(false);
    const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const effectiveIsRunning = (isRunning ?? isRunningLocal) as boolean;

    const performRun = async () => {
        const req: CodeSubmissionRequest = {
            activityId: item.id,
            sectionId: section.id,
            code: codeValue,
            language: "python"
        };

        setIsRunningLocal(true);
        setError(null);
        try {
            const res = await runCode(req, userSession?.jwt ?? "");
            console.log("runCode response:", res);
            if (res.ok) {
                setExecutionResult(res.ok);
            } else {
                setError(res.err ?? "Failed to run code");
                setExecutionResult(null);
            }
        } catch (e: any) {
            setError(String(e?.message ?? e));
            setExecutionResult(null);
        } finally {
            setIsRunningLocal(false);
        }
    };

    const performSubmit = async () => {
        const req: CodeSubmissionRequest = {
            activityId: item.id,
            sectionId: section.id,
            code: codeValue,
            language: "python"
        };

        setIsRunningLocal(true);
        setError(null);
        try {
            const res = await submitCode(req, userSession?.jwt ?? "");
            console.log("submitCode response:", res);
            if (res.ok) {
                setExecutionResult(res.ok);
            } else {
                setError(res.err ?? "Failed to submit code");
                setExecutionResult(null);
            }
        } catch (e: any) {
            setError(String(e?.message ?? e));
            setExecutionResult(null);
        } finally {
            setIsRunningLocal(false);
        }
    };

    return (
        <div className="flex flex-1 h-full">
            {/* Left Panel - Problem Description */}
            <div className="w-1/2 border-r border-white/10 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-4">{item.name}</h1>
                            {item.description && (
                                <p className="text-lg text-gray-300 mb-6">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">
                               Section {sectionIndex + 1} of {item.sections?.length ?? 0}
                            </h3>
                            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400">
                                Code
                            </span>
                        </div>
                        </div>

                        {section.code && (
                            <div className="space-y-5">
                                <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-code:text-blue-300">
                                    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
                                        <PreviewRenderer value={section.code.instructions} />
                                    </Suspense>
                                </div>

                                {section.code.sources && section.code.sources.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                            {section.code.sources.map((source, idx) => (
                                                <li key={idx}>{source}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - Code Editor and Test Cases */}
            <div className="w-1/2 flex flex-col h-full">
                {/* Code Editor */}
                <div className="flex-1 flex flex-col border-b border-white/10">
                    <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                        <span className="text-sm text-gray-400">Code</span>
                        <div className="flex gap-2">
                            <button
                                onClick={performRun}
                                disabled={effectiveIsRunning}
                                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faPlay} className="text-xs" />
                                {effectiveIsRunning ? "Running..." : "Run"}
                            </button>
                            <button
                                onClick={performSubmit}
                                disabled={effectiveIsRunning}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                                {effectiveIsRunning ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            value={codeValue}
                            onChange={(value) => onCodeChange(value || "")}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 4,
                            }}
                        />
                    </div>
                </div>

                {/* Test Cases Panel */}
                <div className="h-64 flex flex-col bg-black/40 overflow-y-hidden">
                    {executionResult ? (
                        <>
                            {/* Execution Summary */}
                            <div className={`px-4 py-3 border-b border-white/10 ${executionResult.success ? "bg-green-500/10" : "bg-red-500/10"}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <FontAwesomeIcon
                                        icon={executionResult.success ? faCheckCircle : faTimesCircle}
                                        className={executionResult.success ? "text-green-400 text-lg" : "text-red-400 text-lg"}
                                    />
                                    <div>
                                        <h3 className={`font-semibold ${executionResult.success ? "text-green-300" : "text-red-300"}`}>
                                            {executionResult.success ? "All Tests Passed" : "Some Tests Failed"}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {executionResult.passedTests} / {executionResult.totalTests} tests passed
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Test Results List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {executionResult.testResults.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded border ${
                                            result.passed
                                                ? "bg-green-500/5 border-green-500/30"
                                                : "bg-red-500/5 border-red-500/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <FontAwesomeIcon
                                                icon={result.passed ? faCheckCircle : faTimesCircle}
                                                className={result.passed ? "text-green-400" : "text-red-400"}
                                            />
                                            <span className="text-sm font-medium text-white">
                                                Test {result.testNumber}{result.testName && `: ${result.testName}`}
                                            </span>
                                        </div>
                                        {!result.passed && (
                                            <div className="text-xs space-y-1 ml-6">
                                                {result.expectedOutput && (
                                                    <div className="text-gray-300">
                                                        <span className="text-gray-500">Expected:</span> {result.expectedOutput}
                                                    </div>
                                                )}
                                                {result.actualOutput && (
                                                    <div className="text-gray-300">
                                                        <span className="text-gray-500">Got:</span> {result.actualOutput}
                                                    </div>
                                                )}
                                                {result.errorMessage && (
                                                    <div className="text-red-400">
                                                        <span className="text-red-500">Error:</span> {result.errorMessage}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {result.executionTimeMs && (
                                            <div className="text-xs text-gray-500 ml-6 mt-1">
                                                Executed in {result.executionTimeMs}ms
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {executionResult.error && (
                                <div className="px-4 py-2 bg-orange-500/10 border-t border-orange-500/30">
                                    <p className="text-xs text-orange-400">{executionResult.error}</p>
                                </div>
                            )}
                        </>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="text-center">
                                <FontAwesomeIcon icon={faTimesCircle} className="text-red-400 text-3xl mb-2" />
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                                <div className="flex gap-2">
                                    {testCases.map((_testCase, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSelectTestCase(idx)}
                                            className={`px-3 py-1.5 text-sm rounded transition ${
                                                selectedTestCase === idx
                                                    ? "bg-white/20 text-white"
                                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                            }`}
                                        >
                                            Case {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {(() => {
                                    const testCase = testCases[selectedTestCase];
                                    return testCase ? (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                                                    {testCase.points} {testCase.points === 1 ? "point" : "points"}
                                                </span>
                                                {testCase.hidden && (
                                                    <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Expected Output:</span>
                                                <div className="mt-1 p-2 bg-white/5 rounded border border-white/10">
                                                    <code className="text-gray-300">{testCase.expected}</code>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">Test inputs are hidden.</p>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
