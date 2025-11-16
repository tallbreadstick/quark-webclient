import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import api from "../scripts/api";

type Course = {
    id: number;
    name: string;
    description?: string | null;
    ownerId?: number | null;
    owner?: { id?: number; username?: string } | null;
    version?: number;
    [key: string]: any;
};

export default function CoursesPage() {
    const { userSession, setUserSession } = loadSessionState();
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchCourses() {
            setLoading(true);
            setError(null);
                try {
                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                // If userSession exists, filter courses to those owned by the user.
                if (userSession && userSession.id != null) {
                    const id = userSession.id;
                    const mine = Array.isArray(data)
                        ? data.filter((c: Course) => c.ownerId === id || (c.owner && c.owner.id === id))
                        : [];
                    setCourses(mine);
                } else {
                    // If not logged in, show an empty list (user must sign in to view owned courses)
                    setCourses([]);
                }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Failed to load courses");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchCourses();
        return () => {
            cancelled = true;
        };
    }, [userSession]);

    return (
        <Page title="Quark | My Courses" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold text-white">My Courses</h1>
                        {userSession ? (
                            <Link to="/my-courses/create" className="px-4 py-2 bg-indigo-600 rounded-md text-white text-sm hover:bg-indigo-500">
                                Create Course
                            </Link>
                        ) : null}
                    </div>

                    {!userSession ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                            <p className="text-gray-300 mb-4">You need to be signed in to view your courses.</p>
                            <div className="flex justify-center gap-3">
                                <Link to="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white">Sign in</Link>
                                <Link to="/register" className="px-4 py-2 border rounded-md text-white/80">Register</Link>
                            </div>
                        </div>
                    ) : (
                        <section>
                            {loading ? (
                                <div className="text-gray-400">Loading your courses...</div>
                            ) : error ? (
                                <div className="text-red-400">Error: {error}</div>
                            ) : courses && courses.length === 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                                    <p className="mb-4">You don't have any courses yet.</p>
                                    <Link to="/my-courses/create" className="px-4 py-2 bg-indigo-600 rounded-md text-white hover:bg-indigo-500">Create your first course</Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {courses?.map((c) => (
                                        <article key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-lg font-semibold text-white">{c.name}</h2>
                                                    <p className="text-sm text-gray-400 mt-2">{c.description ?? "No description provided."}</p>
                                                </div>
                                                <div className="text-sm text-gray-400">v{c.version ?? "-"}</div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="text-xs text-gray-500">Owner: {c.owner?.username ?? c.ownerId ?? "—"}</div>
                                                <div className="flex gap-2">
                                                    <Link to={`/course/${c.id}`} className="px-3 py-1 bg-[#3b82f6] rounded-md text-xs text-white">Open</Link>
                                                    <Link to={`/course/${c.id}/edit`} className="px-3 py-1 border rounded-md text-xs text-white/80">Edit</Link>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </Page>
    );
}
