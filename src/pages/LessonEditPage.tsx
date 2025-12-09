import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { fetchLesson, editLesson } from "../endpoints/LessonHandler";
import type { LessonContentResponse, LessonRequest } from "../endpoints/LessonHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";

const LessonEditPage: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { userSession, setUserSession } = loadSessionState();
    const [lesson, setLesson] = useState<LessonContentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<LessonRequest>({
        name: "",
        description: "",
        icon: "",
        finishMessage: ""
    });

    useEffect(() => {
        if (!lessonId || !userSession?.jwt) return;
        setLoading(true);
        fetchLesson(Number(lessonId), userSession.jwt).then(res => {
            if (res.ok) {
                setLesson(res.ok);
                setForm({
                    name: res.ok.name,
                    description: res.ok.description,
                    icon: res.ok.icon,
                    finishMessage: res.ok.finishMessage || ""
                });
            } else {
                setError(res.err);
            }
            setLoading(false);
        });
    }, [lessonId, userSession?.jwt]);

    const handleChange = (field: keyof LessonRequest, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!lessonId || !userSession?.jwt) return;
        setLoading(true);
        const res = await editLesson(Number(lessonId), form, userSession.jwt);
        if (res.ok) {
            navigate(-1); // Go back after save
        } else {
            setError(res.err);
        }
        setLoading(false);
    };

    return (
        <Page title={`Quark | Lesson Editor`} userSession={userSession} setUserSession={setUserSession}>
            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <div className="text-red-500 p-8">{error}</div>
            ) : !lesson ? (
                <div className="p-8">Lesson not found.</div>
            ) : (
                <div className="max-w-3xl mx-auto py-12 space-y-8">
                    <div className="space-y-4">
                        <input
                            className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-700 focus:outline-none pb-2"
                            value={form.name}
                            onChange={e => handleChange("name", e.target.value)}
                            placeholder="Lesson Title"
                        />
                        <input
                            className="w-full bg-transparent text-lg text-slate-400 placeholder-slate-700 focus:outline-none font-light"
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            placeholder="Add a description..."
                        />
                        <input
                            className="w-full bg-transparent text-lg text-slate-400 placeholder-slate-700 focus:outline-none font-light"
                            value={form.icon}
                            onChange={e => handleChange("icon", e.target.value)}
                            placeholder="Icon URL or name"
                        />
                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-2 block">Finish Message (Markdown/KaTeX)</label>
                            <Editor
                                height="200px"
                                theme="vs-dark"
                                language="markdown"
                                value={form.finishMessage}
                                onChange={val => handleChange("finishMessage", val ?? "")}
                                options={{
                                    minimap: { enabled: false },
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    fontSize: 14,
                                    automaticLayout: true
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-8">
                        <button
                            className="px-6 py-3 rounded-full bg-indigo-600/80 hover:bg-indigo-700 text-white text-sm font-medium transition-all"
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                        <button
                            className="px-6 py-3 rounded-full bg-slate-700/80 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-all"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </Page>
    );
};

export default LessonEditPage;
