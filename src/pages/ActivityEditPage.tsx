import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faGripVertical, faPlus } from '@fortawesome/free-solid-svg-icons';
import Page from "../components/page/Page";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PreviewRenderer from "../components/PreviewRenderer";
import AlertModal from "../components/modals/AlertModal";
import ActionModal from "../components/modals/ActionModal";
import {
    addSection,
    editSection,
    deleteSection,
    reorderSections,
    fetchSection,
    type SectionRequest,
    type MCQSection,
    type CodeSection,
    type TestCase
} from "../endpoints/SectionHandler";
import { fetchActivity } from "../endpoints/ActivityHandler";
import { loadSessionState } from "../types/UserSession";

type LocalSection = {
    id: number;
    sectionType: "MCQ" | "CODE";
    mcq?: MCQSection;
    code?: CodeSection;
};

const ActivityEditPage: React.FC = () => {
    const { activityId } = useParams<{ activityId: string }>();
    const navigate = useNavigate();
    const { userSession, setUserSession } = loadSessionState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sections, setSections] = useState<LocalSection[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState<{ id: number; idx: number; type: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!activityId || !userSession?.jwt) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let aid = activityId;
                let ids: number[] = [];
                if (activityId.includes("|")) {
                    const parts = activityId.split("|");
                    aid = parts[0];
                    ids = parts[1].split(",").map(s => Number(s)).filter(Boolean);
                }

                if (ids.length === 0) {
                    const aidNum = Number(aid);
                    if (!isNaN(aidNum)) {
                        try {
                            const actRes = await fetchActivity(aidNum, userSession.jwt!);
                            if (actRes.ok) {
                                ids = actRes.ok.sections.map(s => s.id);
                            }
                        } catch (e) {
                            console.warn("Failed to fetch activity for sections", e);
                        }
                    }
                }

                if (ids.length === 0) {
                    setSections([]);
                } else {
                    const loaded = await Promise.all(
                        ids.map(async (id) => {
                            const res = await fetchSection(id, userSession.jwt!);
                            if (res.ok) {
                                return res.ok as LocalSection;
                            }
                            return null;
                        })
                    );

                    const list = loaded.filter(Boolean) as LocalSection[];
                    setSections(list);
                    if (list.length > 0) setSelectedId(list[0].id || null);
                }
            } catch (e) {
                console.error(e);
                setError("Failed to load sections");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [activityId, userSession?.jwt]);

    const handleAdd = async (type: "MCQ" | "CODE") => {
        if (!activityId || !userSession?.jwt) return;
        const aid = Number(activityId.split("|")[0]);
        const req: SectionRequest = { sectionType: type };
        if (type === "MCQ") req.mcq = {
            instructions: "New question set",
            questions: [
                {
                    question: "New question",
                    points: 1,
                    correct: "A",
                    choices: ["A", "B", "C", "D"]
                }
            ]
        };
        else req.code = { renderer: "MARKDOWN", instructions: "New code task", testCases: [ { expected: "true", driver: "function test(){return true;}", points: 1, hidden: false } ] };

        const res = await addSection(aid, req, userSession.jwt);
        if (res.ok) {
            try {
                const actRes = await fetchActivity(aid, userSession.jwt!);
                if (actRes.ok) {
                    const ids = actRes.ok.sections.map(s => s.id);
                    const loaded = await Promise.all(
                        ids.map(async (id) => {
                            const r = await fetchSection(id, userSession.jwt!);
                            if (r.ok) return r.ok as LocalSection;
                            return null;
                        })
                    );
                    const list = loaded.filter(Boolean) as LocalSection[];
                    setSections(list);
                    if (list.length > 0) setSelectedId(list[list.length - 1].id || null);
                    return;
                }
            } catch (e) {
                console.warn("Failed to refresh sections after create", e);
            }

            const maybeId = Number(res.ok);
            if (!isNaN(maybeId) && maybeId > 0) {
                const fetched = await fetchSection(maybeId, userSession.jwt!);
                if (fetched.ok) {
                    setSections(prev => [...prev, fetched.ok as LocalSection]);
                    setSelectedId(maybeId);
                    return;
                }
            }

            setError(res.ok);
        } else setError(res.err);
    };

    const handleDeleteClick = (id: number, idx: number, type: string) => {
        setSectionToDelete({ id, idx, type });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!sectionToDelete || !userSession?.jwt) return;
        
        const res = await deleteSection(sectionToDelete.id, userSession.jwt);
        
        if (res.ok) {
            setSections(prev => prev.filter(s => s.id !== sectionToDelete.id));
            if (selectedId === sectionToDelete.id) setSelectedId(null);
            setShowDeleteModal(false);
            setShowDeleteSuccessModal(true);
        } else {
            setError(res.err);
            setShowDeleteModal(false);
        }
        setSectionToDelete(null);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setSectionToDelete(null);
    };

    const handleSaveSection = async (id: number, updated: Partial<LocalSection>) => {
        if (!userSession?.jwt) return;
        const orig = sections.find(s => s.id === id);
        if (!orig) return;

        const req: SectionRequest = { sectionType: orig.sectionType };
        if (orig.sectionType === "MCQ") req.mcq = (updated.mcq ?? orig.mcq) as MCQSection;
        else req.code = (updated.code ?? orig.code) as CodeSection;

        const res = await editSection(id, req, userSession.jwt);
        if (res.ok) {
            setSections(prev => prev.map(s => s.id === id ? { ...s, ...updated } as LocalSection : s));
        } else setError(res.err);
    };

    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetIdx: number) => {
        if (draggedIdx === null || !activityId || !userSession?.jwt) return;
        if (draggedIdx === targetIdx) {
            setDraggedIdx(null);
            return;
        }

        const aid = Number(activityId.split("|")[0]);
        const copy = [...sections];
        const [moved] = copy.splice(draggedIdx, 1);
        copy.splice(targetIdx, 0, moved);
        
        // Update UI immediately for smooth UX
        setSections(copy);
        setDraggedIdx(null);

        // Send API request in background without showing loading state
        try {
            const res = await reorderSections(aid, copy.map(s => s.id), userSession.jwt);
            if (!res.ok) {
                setError(res.err);
                // Optionally reload sections on error
                const actRes = await fetchActivity(aid, userSession.jwt!);
                if (actRes.ok) {
                    const ids = actRes.ok.sections.map(s => s.id);
                    const loaded = await Promise.all(
                        ids.map(async (id) => {
                            const r = await fetchSection(id, userSession.jwt!);
                            if (r.ok) return r.ok as LocalSection;
                            return null;
                        })
                    );
                    const list = loaded.filter(Boolean) as LocalSection[];
                    setSections(list);
                }
            }
        } catch (error) {
            console.error("Failed to reorder sections:", error);
            setError("Failed to save reorder. Please refresh the page.");
        }
    };

    if (loading) return <Page title="Activity Editor" userSession={userSession} setUserSession={setUserSession}><LoadingSkeleton/></Page>;

    return (
        <Page title={`Quark | Activity Editor`} userSession={userSession} setUserSession={setUserSession}>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Activity Editor</h1>
                            <p className="text-gray-400">Create and manage quiz and coding sections</p>
                        </div>
                        <button 
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 cursor-pointer" 
                            onClick={() => navigate(-1)}
                        >
                            ← Back
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-4 gap-6">
                    {/* Sections List */}
                    <div className="col-span-1">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 sticky top-8">
                            <h2 className="text-lg font-semibold text-white mb-4">Sections ({sections.length})</h2>
                            
                            {/* Add Section Buttons */}
                            <div className="mb-4 flex gap-2">
                                <button 
                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm cursor-pointer"
                                    onClick={() => handleAdd("MCQ")}
                                >
                                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                                    MCQ
                                </button>
                                <button 
                                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm cursor-pointer"
                                    onClick={() => handleAdd("CODE")}
                                >
                                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                                    Code
                                </button>
                            </div>
                            
                            {sections.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 text-sm">No sections yet</p>
                                    <p className="text-gray-500 text-xs mt-2">Add questions above to get started</p>
                                </div>
                            ) : (
                                <ul className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                                    {sections.map((s, idx) => (
                                        <li 
                                            key={s.id} 
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                                selectedId === s.id 
                                                    ? 'bg-indigo-600/20 border-indigo-500/50' 
                                                    : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                                            }`}
                                            draggable
                                            onDragStart={() => handleDragStart(idx)}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(idx)}
                                            onClick={() => setSelectedId(s.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon 
                                                    icon={faGripVertical} 
                                                    className="w-3 h-3 text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.sectionType === 'MCQ' ? 'bg-blue-500/40 text-blue-200' : 'bg-emerald-500/40 text-emerald-200'}`}>
                                                            {s.sectionType}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-300 truncate">
                                                        {s.sectionType === 'MCQ' ? (s.mcq?.instructions || 'No title') : (s.code?.instructions || 'No title')}
                                                    </div>
                                                </div>
                                                <button 
                                                    className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors flex-shrink-0" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleDeleteClick(s.id, idx, s.sectionType); 
                                                    }}
                                                    title="Delete section"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3 cursor-pointer" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Editor Panel */}
                    <div className="col-span-3 bg-slate-800/50 border border-slate-700 rounded-lg p-6 min-h-[600px]">
                        {selectedId ? (
                            (() => {
                                const s = sections.find(x => x.id === selectedId)!;
                                if (!s) return <div className="text-gray-400 text-center py-8">Section not found</div>;
                                if (s.sectionType === 'MCQ') {
                                    return (
                                        <MCQEditor section={s} onSave={(upd) => handleSaveSection(s.id, upd)} />
                                    );
                                }
                                return (
                                    <CodeEditor section={s} onSave={(upd) => handleSaveSection(s.id, upd)} />
                                );
                            })()
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="mb-4 text-6xl">📋</div>
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Section Selected</h3>
                                <p className="text-gray-400 max-w-sm">Select a section from the list on the left or create a new one to start editing</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <ActionModal
                    isOpen={showDeleteModal}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    title="Delete Section"
                    message={`Are you sure you want to delete this ${sectionToDelete?.type || ''} section? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="warning"
                />

                {/* Delete Success Modal */}
                <AlertModal
                    isOpen={showDeleteSuccessModal}
                    onClose={() => setShowDeleteSuccessModal(false)}
                    title="Section Deleted Successfully"
                    message="The section has been removed from this activity."
                    variant="success"
                    buttonText="Okay"
                />
            </div>
        </Page>
    );
};

function MCQEditor({ section, onSave }: { section: LocalSection, onSave: (s: Partial<LocalSection>)=>void }) {
    const initial: MCQSection = section.mcq ?? { instructions: '', questions: [ { question: '', points: 1, correct: '', choices: ['', ''] } ] };
    const [mcq, setMcq] = useState<MCQSection>(initial);

    useEffect(()=>{
        setMcq(section.mcq ?? { instructions: '', questions: [ { question: '', points: 1, correct: '', choices: ['', ''] } ] });
    }, [section.id]);

    const updateQuestion = (idx: number, patch: Partial<import("../endpoints/SectionHandler").Question>) => {
        setMcq(prev => {
            const copy = { ...prev, questions: prev.questions.map(q => ({ ...q })) };
            copy.questions[idx] = { ...copy.questions[idx], ...patch } as any;
            return copy;
        });
    };

    const updateChoice = (qIdx: number, cIdx: number, value: string) => {
        setMcq(prev => {
            const copy = { ...prev, questions: prev.questions.map(q => ({ ...q, choices: [...q.choices] })) };
            copy.questions[qIdx].choices[cIdx] = value;
            return copy;
        });
    };

    const addQuestion = () => {
        setMcq(prev => ({ ...prev, questions: [...prev.questions, { question: '', points: 1, correct: '', choices: ['', ''] }] }));
    };

    const removeQuestion = (idx: number) => {
        setMcq(prev => ({ ...prev, questions: prev.questions.filter((_, i)=>i!==idx) }));
    };

    const addChoice = (qIdx: number) => {
        setMcq(prev => {
            const copy = { ...prev, questions: prev.questions.map(q => ({ ...q, choices: [...q.choices] })) };
            copy.questions[qIdx].choices.push('');
            return copy;
        });
    };

    const removeChoice = (qIdx: number, cIdx: number) => {
        setMcq(prev => {
            const copy = { ...prev, questions: prev.questions.map(q => ({ ...q, choices: [...q.choices] })) };
            copy.questions[qIdx].choices = copy.questions[qIdx].choices.filter((_, i)=>i!==cIdx);
            return copy;
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Multiple Choice Questions Assessment</h2>
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-2">Section Instructions</label>
                <textarea 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-vertical min-h-20" 
                    placeholder="Provide instructions for this section..." 
                    value={mcq.instructions} 
                    onChange={(e)=>setMcq(prev=>({ ...prev, instructions: e.target.value }))} 
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Questions ({mcq.questions.length})</h3>
                    <button 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                        onClick={addQuestion}
                    >
                        + Add Question
                    </button>
                </div>

                <div className="space-y-4">
                    {mcq.questions.map((q, qi) => (
                        <div key={qi} className="p-5 bg-slate-900/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/30 text-blue-200 text-sm font-bold">
                                        {qi + 1}
                                    </span>
                                    <div>
                                        <p className="text-white font-medium">Question {qi + 1}</p>
                                    </div>
                                </div>
                                <button 
                                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-sm font-medium rounded transition-colors duration-200 cursor-pointer"  
                                    onClick={() => removeQuestion(qi)}
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
                                    <input 
                                        type="text"
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                                        placeholder="Enter your question..." 
                                        value={q.question} 
                                        onChange={(e) => updateQuestion(qi, { question: e.target.value })} 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                                        <input 
                                            type="number" 
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                                            value={q.points} 
                                            onChange={(e) => updateQuestion(qi, { points: Number(e.target.value) || 0 })} 
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Correct Choice</label>
                                        <input 
                                            type="text"
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                                            placeholder="e.g., A" 
                                            value={q.correct} 
                                            onChange={(e) => updateQuestion(qi, { correct: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-300">Answer Choices</label>
                                        <button 
                                            className="text-xs px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 rounded font-medium transition-colors duration-200 cursor-pointer"
                                            onClick={() => addChoice(qi)}
                                        >
                                            + Add Choice
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {q.choices.map((c, ci) => (
                                            <div key={ci} className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                                    {String.fromCharCode(65 + ci)}
                                                </span>
                                                <input 
                                                    type="text"
                                                    className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                                                    placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                                                    value={c} 
                                                    onChange={(e) => updateChoice(qi, ci, e.target.value)} 
                                                />
                                                <button 
                                                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded transition-colors duration-200 text-sm font-medium"
                                                    onClick={() => removeChoice(qi, ci)}
                                                    title="Remove choice"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4 cursor-pointer" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-600">
                <button 
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                    onClick={() => onSave({ mcq })}
                >
                    ✓ Save Changes
                </button>
            </div>
        </div>
    );
}

function CodeEditor({ section, onSave }: { section: LocalSection, onSave: (s: Partial<LocalSection>)=>void }) {
    const initial = section.code ?? { renderer: 'MARKDOWN' as const, instructions: '', defaultCode: '', sources: [], testCases: [ { expected: '', driver: '', points: 1, hidden: false } ] };
    const [code, setCode] = useState<CodeSection>(initial as CodeSection);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    useEffect(()=>{ 
        setCode(section.code ?? { renderer: 'MARKDOWN' as const, instructions: '', defaultCode: '', sources: [], testCases: [ { expected: '', driver: '', points: 1, hidden: false } ] } as CodeSection); 
        setIsPreviewMode(false);
    }, [section.id]);

    const updateTestCase = (idx: number, patch: Partial<TestCase>) => {
        setCode(prev => {
            const copy = { ...prev, testCases: prev.testCases.map(t=>({ ...t })) } as CodeSection & { testCases: TestCase[] };
            copy.testCases[idx] = { ...copy.testCases[idx], ...patch };
            return copy;
        });
    };

    const addTestCase = () => setCode(prev => ({ ...prev, testCases: [...prev.testCases, { expected: '', driver: '', points: 1, hidden: false }] }));
    const removeTestCase = (idx: number) => setCode(prev => ({ ...prev, testCases: prev.testCases.filter((_,i)=>i!==idx) }));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Coding Challenge</h2>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-white">Instructions (Markdown/KaTeX)</label>
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={isPreviewMode ? faEdit : faEye} className="w-4 h-4" />
                        {isPreviewMode ? 'Edit' : 'Preview'}
                    </button>
                </div>
                {isPreviewMode ? (
                    <div className="w-full bg-white border border-gray-200 rounded-lg p-6 text-slate-900 min-h-[240px]">
                        <div className="prose max-w-none ">
                            <PreviewRenderer value={code.instructions} />
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <Editor
                            height="240px"
                            defaultLanguage="markdown"
                            theme="vs-dark"
                            value={code.instructions}
                            onChange={(value) => setCode(prev => ({ ...prev, instructions: value ?? '' }))}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Starter Code (Monaco) */}
            <div>
                <label className="block text-sm font-medium text-white mb-2">Starter Code (Optional)</label>
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <Editor
                        height="260px"
                        defaultLanguage="python"
                        theme="vs-dark"
                        value={code.defaultCode ?? ''}
                        onChange={(value) => setCode(prev => ({ ...prev, defaultCode: value ?? '' }))}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: "on",
                        }}
                    />
                </div>
            </div>

            {/* Test Cases */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Test Cases ({code.testCases.length})</h3>
                    <button 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                        onClick={addTestCase}
                    >
                        + Add Test Case
                    </button>
                </div>

                <div className="space-y-4">
                    {code.testCases.map((t, ti) => (
                        <div key={ti} className="p-5 bg-slate-900/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-200 text-sm font-bold">
                                        {ti + 1}
                                    </span>
                                    <div>
                                        <p className="text-white font-medium">Test Case {ti + 1}</p>
                                    </div>
                                </div>
                                <button 
                                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-sm font-medium rounded transition-colors duration-200 cursor-pointer"
                                    onClick={() => removeTestCase(ti)}
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Driver Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Driver / Test Code</label>
                                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                                        <Editor
                                            height="220px"
                                            defaultLanguage="python"
                                            theme="vs-dark"
                                            value={t.driver ?? ''}
                                            onChange={(value) => updateTestCase(ti, { driver: value ?? '' })}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                wordWrap: "on",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expected Output */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Expected Output</label>
                                    <textarea 
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm resize-vertical min-h-16" 
                                        placeholder="Expected result..." 
                                        value={t.expected} 
                                        onChange={(e) => updateTestCase(ti, { expected: e.target.value })} 
                                    />
                                </div>

                                {/* Points & Hidden */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                                        <input 
                                            type="number" 
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                                            value={t.points} 
                                            onChange={(e) => updateTestCase(ti, { points: Number(e.target.value) || 0 })} 
                                            min="0"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-end gap-3 pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={t.hidden} 
                                                onChange={(e) => updateTestCase(ti, { hidden: e.target.checked })}
                                                className="w-4 h-4 rounded bg-slate-900/50 border border-slate-600 cursor-pointer accent-blue-600"
                                            />
                                            <span className="text-sm font-medium text-gray-300">Hidden from students</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-slate-600">
                <button 
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                    onClick={() => onSave({ code })}
                >
                    ✓ Save Changes
                </button>
            </div>
        </div>
    );
}

export default ActivityEditPage;