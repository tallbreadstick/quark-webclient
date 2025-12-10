import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
    addSection,
    editSection,
    deleteSection,
    reorderSections,
    fetchSection,
    type SectionRequest,
    type MCQSection,
    type CodeSection
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

    // On mount: try to load sections list from activity by fetching each section id.
    // Some backends return section list on activity; here we assume activityId param
    // contains an activity with sections available via a separate call from the parent.
    // To be resilient, accept a pipe-separated value: "<activityId>|<id,id,id>"
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
                    // Try fetching activity to discover section ids
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

        setLoading(true);
        const res = await addSection(aid, req, userSession.jwt);
        setLoading(false);
        if (res.ok) {
            // The backend often returns a message rather than the new ID. Refresh
            // the activity's sections list so the UI reflects the new section.
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

            // fallback: try to parse id from response message
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

    const handleDelete = async (id: number) => {
        if (!userSession?.jwt) return;
        if (!confirm("Delete this section?")) return;
        setLoading(true);
        const res = await deleteSection(id, userSession.jwt);
        setLoading(false);
        if (res.ok) {
            setSections(prev => prev.filter(s => s.id !== id));
            if (selectedId === id) setSelectedId(null);
        } else setError(res.err);
    };

    const handleSaveSection = async (id: number, updated: Partial<LocalSection>) => {
        if (!userSession?.jwt) return;
        const orig = sections.find(s => s.id === id);
        if (!orig) return;

        const req: SectionRequest = { sectionType: orig.sectionType };
        if (orig.sectionType === "MCQ") req.mcq = (updated.mcq ?? orig.mcq) as MCQSection;
        else req.code = (updated.code ?? orig.code) as CodeSection;

        setLoading(true);
        const res = await editSection(id, req, userSession.jwt);
        setLoading(false);
        if (res.ok) {
            setSections(prev => prev.map(s => s.id === id ? { ...s, ...updated } as LocalSection : s));
        } else setError(res.err);
    };

    const handleReorder = async (fromIdx: number, toIdx: number) => {
        if (!activityId || !userSession?.jwt) return;
        const aid = Number(activityId.split("|")[0]);
        const copy = [...sections];
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        setSections(copy);

        setLoading(true);
        const res = await reorderSections(aid, copy.map(s => s.id), userSession.jwt);
        setLoading(false);
        if (!res.ok) {
            setError(res.err);
        }
    };

    if (loading) return <Page title="Activity Editor" userSession={userSession} setUserSession={setUserSession}><LoadingSkeleton/></Page>;

    return (
        <Page title={`Quark | Activity Editor`} userSession={userSession} setUserSession={setUserSession}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Activity Sections</h2>
                    <div>
                        <button className="btn mr-2" onClick={() => navigate(-1)}>Back</button>
                        <button className="btn mr-2" onClick={() => handleAdd("MCQ")}>Add MCQ</button>
                        <button className="btn" onClick={() => handleAdd("CODE")}>Add Code</button>
                    </div>
                </div>

                {error && <div className="text-red-500 mb-4">{error}</div>}

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 bg-black/20 border rounded p-3">
                        <h3 className="font-medium mb-2">Sections</h3>
                        <ul>
                            {sections.map((s, idx) => (
                                <li key={s.id} className={`p-2 rounded mb-2 cursor-pointer ${selectedId===s.id ? 'bg-white/5' : ''}`} draggable onDragStart={(e)=>{e.dataTransfer.setData('text/plain', String(idx));}} onDrop={(e)=>{const from=Number(e.dataTransfer.getData('text/plain')); handleReorder(from, idx);}} onDragOver={(e)=>e.preventDefault()} onClick={()=>setSelectedId(s.id)}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm">{s.sectionType} — #{s.id}</div>
                                            <div className="text-xs text-gray-400">{s.sectionType === 'MCQ' ? (s.mcq?.instructions || 'MCQ') : (s.code?.instructions || 'Code')}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="text-sm text-red-400" onClick={(e)=>{e.stopPropagation(); handleDelete(s.id);}}>Delete</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {sections.length === 0 && <li className="text-sm text-gray-400">No sections yet. Add one above.</li>}
                        </ul>
                    </div>

                    <div className="col-span-2 bg-black/20 border rounded p-4 min-h-[200px]">
                        {selectedId ? (
                            (() => {
                                const s = sections.find(x=>x.id===selectedId)!;
                                if (!s) return <div>Section not found</div>;
                                if (s.sectionType === 'MCQ') {
                                    return (
                                        <MCQEditor section={s} onSave={(upd)=>handleSaveSection(s.id, upd)} />
                                    );
                                }
                                return (
                                    <CodeEditor section={s} onSave={(upd)=>handleSaveSection(s.id, upd)} />
                                );
                            })()
                        ) : (
                            <div className="text-gray-400">Select a section to edit.</div>
                        )}
                    </div>
                </div>
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
        <div>
            <h3 className="font-medium mb-2">MCQ Section #{section.id}</h3>
            <label className="block text-sm mb-1">Instructions</label>
            <textarea className="w-full p-2 mb-3 bg-slate-900 border rounded" value={mcq.instructions} onChange={(e)=>setMcq(prev=>({ ...prev, instructions: e.target.value }))} />

            <div className="space-y-4">
                {mcq.questions.map((q, qi) => (
                    <div key={qi} className="p-3 bg-slate-800 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Question {qi+1}</div>
                            <div className="flex items-center gap-2">
                                <button className="text-sm text-red-400" onClick={()=>removeQuestion(qi)}>Remove</button>
                            </div>
                        </div>

                        <label className="text-xs">Question text</label>
                        <input className="w-full p-1 mb-2 bg-slate-900 border rounded" value={q.question} onChange={(e)=>updateQuestion(qi, { question: e.target.value })} />

                        <div className="flex gap-2 mb-2">
                            <div>
                                <label className="text-xs">Points</label>
                                <input type="number" className="w-24 p-1 ml-2 bg-slate-900 border rounded" value={q.points} onChange={(e)=>updateQuestion(qi, { points: Number(e.target.value) || 0 })} />
                            </div>
                            <div>
                                <label className="text-xs">Correct choice</label>
                                <input className="w-36 p-1 ml-2 bg-slate-900 border rounded" value={q.correct} onChange={(e)=>updateQuestion(qi, { correct: e.target.value })} />
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="text-sm font-medium mb-1">Choices</div>
                            {q.choices.map((c, ci) => (
                                <div key={ci} className="flex items-center gap-2 mb-1">
                                    <input className="flex-1 p-1 bg-slate-900 border rounded" value={c} onChange={(e)=>updateChoice(qi, ci, e.target.value)} />
                                    <button className="text-sm text-red-400" onClick={()=>removeChoice(qi, ci)}>x</button>
                                </div>
                            ))}
                            <button className="btn mt-1" onClick={()=>addChoice(qi)}>Add Choice</button>
                        </div>
                    </div>
                ))}

                <div>
                    <button className="btn mr-2" onClick={addQuestion}>Add Question</button>
                    <button className="btn" onClick={()=>onSave({ mcq })}>Save Section</button>
                </div>
            </div>
        </div>
    );
}

function CodeEditor({ section, onSave }: { section: LocalSection, onSave: (s: Partial<LocalSection>)=>void }) {
    const initial = section.code ?? { renderer: 'MARKDOWN' as const, instructions: '', defaultCode: '', sources: [], testCases: [ { expected: '', driver: '', points: 1, hidden: false } ] };
    const [code, setCode] = useState<CodeSection>(initial as CodeSection);

    useEffect(()=>{ setCode(section.code ?? { renderer: 'MARKDOWN' as const, instructions: '', defaultCode: '', sources: [], testCases: [ { expected: '', driver: '', points: 1, hidden: false } ] } as CodeSection); }, [section.id]);

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
        <div>
            <h3 className="font-medium mb-2">Code Section #{section.id}</h3>
            <label className="block text-sm mb-1">Renderer</label>
            <select className="mb-2 p-1 bg-slate-900 border rounded" value={code.renderer} onChange={(e)=>setCode(prev=>({ ...prev, renderer: e.target.value as CodeSection['renderer'] }))}>
                <option value="MARKDOWN">MARKDOWN</option>
                <option value="LATEX">LATEX</option>
            </select>

            <label className="block text-sm mb-1">Instructions</label>
            <textarea className="w-full p-2 mb-3 bg-slate-900 border rounded" value={code.instructions} onChange={(e)=>setCode(prev=>({ ...prev, instructions: e.target.value }))} />

            <label className="block text-sm mb-1">Default Code</label>
            <textarea className="w-full p-2 mb-3 bg-slate-900 border rounded" value={code.defaultCode ?? ''} onChange={(e)=>setCode(prev=>({ ...prev, defaultCode: e.target.value }))} />

            <div className="space-y-3 mb-3">
                <div className="font-medium">Test Cases</div>
                {code.testCases.map((t, ti) => (
                    <div key={ti} className="p-2 bg-slate-800 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <div>Case {ti+1}</div>
                            <button className="text-sm text-red-400" onClick={()=>removeTestCase(ti)}>Remove</button>
                        </div>
                        <label className="text-xs">Expected</label>
                        <input className="w-full p-1 mb-1 bg-slate-900 border rounded" value={t.expected} onChange={(e)=>updateTestCase(ti, { expected: e.target.value })} />
                        <label className="text-xs">Driver</label>
                        <textarea className="w-full p-1 mb-1 bg-slate-900 border rounded" value={t.driver} onChange={(e)=>updateTestCase(ti, { driver: e.target.value })} />
                        <div className="flex gap-2 items-center">
                            <label className="text-xs">Points</label>
                            <input type="number" className="w-20 p-1 bg-slate-900 border rounded" value={t.points} onChange={(e)=>updateTestCase(ti, { points: Number(e.target.value) || 0 })} />
                            <label className="text-xs ml-4">Hidden</label>
                            <input type="checkbox" checked={t.hidden} onChange={(e)=>updateTestCase(ti, { hidden: e.target.checked })} />
                        </div>
                    </div>
                ))}
                <div className="mt-2">
                    <button className="btn mr-2" onClick={addTestCase}>Add Test Case</button>
                    <button className="btn" onClick={()=>onSave({ code })}>Save Section</button>
                </div>
            </div>
        </div>
    );
}

export default ActivityEditPage;
