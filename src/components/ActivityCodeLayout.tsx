import React, { Suspense, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Editor from "@monaco-editor/react";
import type { Item, ItemSection } from "../types/CourseContentTypes";
import { runCode, submitCode, type CodeSubmissionRequest } from "../endpoints/CodeExecutionHandler";
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
    const [testResultsLocal, setTestResultsLocal] = useState<string | null>(null);

    const effectiveIsRunning = (isRunning ?? isRunningLocal) as boolean;
    const effectiveTestResults = testResults ?? testResultsLocal;

    const performRun = async () => {
        // Build request
        const req: CodeSubmissionRequest = {
            activityId: item.id,
            sectionId: section.id,
            code: codeValue,
            language: "python"
        };

        setIsRunningLocal(true);
        setTestResultsLocal(null);
            try {
            const res = await runCode(req, userSession?.jwt ?? "");
            console.log("runCode response:", res);
            if (res.ok) {
                setTestResultsLocal(JSON.stringify(res.ok, null, 2));
            } else {
                setTestResultsLocal(res.err);
            }
        } catch (e: any) {
            setTestResultsLocal(String(e?.message ?? e));
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
        setTestResultsLocal(null);
            try {
            const res = await submitCode(req, userSession?.jwt ?? "");
            console.log("submitCode response:", res);
            if (res.ok) {
                setTestResultsLocal(JSON.stringify(res.ok, null, 2));
            } else {
                setTestResultsLocal(res.err);
            }
        } catch (e: any) {
            setTestResultsLocal(String(e?.message ?? e));
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
                            <h1 className="text-2xl font-bold text-white mb-2">{item.name}</h1>
                            {item.description && (
                                <p className="text-sm text-gray-400 mb-4">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                                    Section {sectionIndex + 1} of {item.sections?.length ?? 0}
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
                                onClick={async () => { await performRun(); try { onRun && onRun(); } catch {} }}
                                disabled={effectiveIsRunning}
                                className="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faPlay} className="text-xs" />
                                Run
                            </button>
                            <button
                                onClick={async () => { await performSubmit(); try { onSubmit && onSubmit(); } catch {} }}
                                disabled={effectiveIsRunning}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                                Submit
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
                        {testResults ? (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-green-400">Test Result</h4>
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{testResults}</pre>
                            </div>
                        ) : (
                            (() => {
                                const testCase = testCases[selectedTestCase];
                                return testCase ? (
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-400">Input:</span>
                                            <div className="mt-1 p-2 bg-white/5 rounded border border-white/10">
                                                <code className="text-gray-300">{testCase.driver}</code>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Expected Output:</span>
                                            <div className="mt-1 p-2 bg-white/5 rounded border border-white/10">
                                                <code className="text-gray-300">{testCase.expected}</code>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                                                {testCase.points} {testCase.points === 1 ? "point" : "points"}
                                            </span>
                                            {testCase.hidden && (
                                                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                                                    Hidden
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : null;
                            })()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
