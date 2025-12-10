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
    const [instructions, setInstructions] = useState(section.mcq?.instructions || "");

    useEffect(()=>{ setInstructions(section.mcq?.instructions || ""); }, [section.id]);

    return (
        <div>
            <h3 className="font-medium mb-2">MCQ Section #{section.id}</h3>
            <label className="block text-sm mb-1">Instructions</label>
            <textarea className="w-full p-2 mb-3 bg-slate-900 border rounded" value={instructions} onChange={(e)=>setInstructions(e.target.value)} />
            <div className="flex gap-2">
                <button className="btn" onClick={()=>{
                    const mcqPayload = { ...(section.mcq ?? { instructions: '', questions: [] }), instructions } as MCQSection;
                    onSave({ mcq: mcqPayload });
                }}>Save</button>
            </div>
        </div>
    );
}

function CodeEditor({ section, onSave }: { section: LocalSection, onSave: (s: Partial<LocalSection>)=>void }) {
    const [instructions, setInstructions] = useState(section.code?.instructions || "");
    const [renderer, setRenderer] = useState<"MARKDOWN"|"LATEX">((section.code?.renderer || "MARKDOWN") as "MARKDOWN"|"LATEX");

    useEffect(()=>{ setInstructions(section.code?.instructions || ""); setRenderer((section.code?.renderer || "MARKDOWN") as "MARKDOWN"|"LATEX"); }, [section.id]);

    return (
        <div>
            <h3 className="font-medium mb-2">Code Section #{section.id}</h3>
            <label className="block text-sm mb-1">Renderer</label>
            <select className="mb-2 p-1 bg-slate-900 border rounded" value={renderer} onChange={(e)=>setRenderer(e.target.value as "MARKDOWN"|"LATEX")}>
                <option value="MARKDOWN">MARKDOWN</option>
                <option value="LATEX">LATEX</option>
            </select>

            <label className="block text-sm mb-1">Instructions</label>
            <textarea className="w-full p-2 mb-3 bg-slate-900 border rounded" value={instructions} onChange={(e)=>setInstructions(e.target.value)} />

            <div className="flex gap-2">
                <button className="btn" onClick={()=>{
                    const codePayload = { ...(section.code ?? { renderer: 'MARKDOWN', instructions: '', testCases: [] }), instructions, renderer } as CodeSection;
                    onSave({ code: codePayload });
                }}>Save</button>
            </div>
        </div>
    );
}

export default ActivityEditPage;
