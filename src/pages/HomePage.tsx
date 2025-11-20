import { motion } from "framer-motion";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../scripts/api";

type Course = {
    id: number;
    name: string;
    description?: string | null;
    ownerId?: number | null;
    owner?: { id?: number; username?: string } | null;
    version?: number;
    tags?: string[];
    [key: string]: any;
};

export default function HomePage() {
    const { userSession, setUserSession } = loadSessionState();
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);
    const isLoggedIn = userSession !== null;

    useEffect(() => {
        if (!isLoggedIn) return;

        let cancelled = false;

        async function fetchCourses() {
            setLoading(true);
            try {
                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                if (userSession && userSession.id != null) {
                    if (userSession.userType === 'educator') {
                        // Educators see courses they own
                        const id = userSession.id;
                        const mine = Array.isArray(data)
                            ? data.filter((c: Course) => c.ownerId === id || (c.owner && c.owner.id === id))
                            : [];
                        setCourses(mine.slice(0, 5)); // Limit to 5 courses
                    } else {
                        // Learners and students see courses they're enrolled in
                        setCourses([]); // For now, show empty
                    }
                } else {
                    setCourses([]);
                }
            } catch (err: any) {
                console.error("Failed to load courses:", err);
                setCourses([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchCourses();
        return () => {
            cancelled = true;
        };
    }, [userSession, isLoggedIn]);

    // Check user roles
    const isEducator = userSession?.userType === 'educator';
    const isLearner = userSession?.userType === 'learner';

    // Personalized welcome messages FROM FIRST CODE
    const getWelcomeMessage = () => {
        if (isEducator) {
            return "Ready to inspire the next generation of learners?";
        } else if (isLearner) {
            return "Your learning adventure continues — explore, discover, and grow.";
        }
        return "Continue your journey through knowledge — explore your active courses and track your progress.";
    };

    return (
        <Page title="Quark | Home" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-12 py-16 text-gray-200">
                {!isLoggedIn ? (
                    // --- Logged out state ---
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl text-center"
                    >
                        <h1 className="text-5xl font-bold mb-6 text-white">
                            Discover Knowledge at the Fundamental Level
                        </h1>
                        <p className="text-lg mb-10 text-gray-400 leading-relaxed">
                            Quark is an interactive learning platform designed for the curious — 
                            bridging the gap between programming and the physical sciences. 
                            Explore simulations, challenges, and projects that spark understanding 
                            from the atomic to the cosmic.
                        </p>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            <Link
                                to="/marketplace"
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white shadow-lg transition-all duration-300"
                            >
                                Browse the Marketplace
                            </Link>
                        </motion.div>

                        <div className="mt-20 text-sm text-gray-500 italic">
                            "The pursuit of understanding is the noblest form of curiosity."
                        </div>
                    </motion.div>
                ) : (
                    // --- Logged in state ---
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-6xl"
                    >
                        <h1 className="text-4xl font-semibold text-white mb-4">
                            Welcome back, {userSession.username || "Explorer"}.
                        </h1>
                        <p className="text-gray-400 mb-12">
                            {getWelcomeMessage()} {/* PERSONALIZED MESSAGE FROM FIRST CODE */}
                        </p>

                        {/* Quick Access / Dashboard Section - Role specific FROM FIRST CODE */}
                        <section className="grid grid-cols-3 gap-6 mb-16">
                            {/* Recent Activity - Common for both roles */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">Recent Activity</p>
                            </div>

                            {/* Role-specific middle card */}
                            {isEducator ? (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                    <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                    <p className="mt-2 text-sm text-gray-500">Course Analytics</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                    <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                    <p className="mt-2 text-sm text-gray-500">Learning Progress</p>
                                </div>
                            )}

                            {/* Role-specific third card */}
                            {isEducator ? (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                    <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                    <p className="mt-2 text-sm text-gray-500">Student Engagement</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                    <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                    <p className="mt-2 text-sm text-gray-500">Learning Tracks</p>
                                </div>
                            )}
                        </section>

                        {/* Your Courses section - USING LAYOUT FROM SECOND CODE */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white">Your Courses</h2>
                                <Link 
                                    to="/my-courses" 
                                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                >
                                    View all courses →
                                </Link>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div 
                                            key={index}
                                            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="h-6 bg-white/10 rounded mb-2 w-1/3"></div>
                                                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="h-8 bg-white/10 rounded w-16"></div>
                                                    <div className="h-8 bg-white/10 rounded w-12"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : courses && courses.length > 0 ? (
                                <div className="space-y-4">
                                    {courses.map((course) => (
                                        <div 
                                            key={course.id} 
                                            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-center">
                                                {/* Title and Description on left */}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-white mb-2">
                                                        {course.name}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">
                                                        {course.description ?? "No description provided."}
                                                    </p>
                                                </div>

                                                {/* Buttons on right */}
                                                <div className="flex gap-2 ml-6">
                                                    {isEducator ? (
                                                        <>
                                                            <Link 
                                                                to={`/course/${course.id}/edit`} 
                                                                className="px-4 py-2 border border-white/20 rounded-lg text-white/80 hover:bg-white/5 transition"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <Link 
                                                                to={`/course/${course.id}/chapters`} 
                                                                className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
                                                            >
                                                                Open
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <Link 
                                                            to={`/course/${course.id}/chapters`} 
                                                            className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
                                                        >
                                                            Start
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                                    {isEducator ? (
                                        <>
                                            <p className="mb-4">You don't have any courses yet.</p>
                                            <Link to="/my-courses/create" className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition text-sm">
                                                Create your first course
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-4">You haven't enrolled in any courses yet.</p>
                                            <Link to="/marketplace" className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition text-sm">
                                                Browse Courses
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </Page>
    );
}