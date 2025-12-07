import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { useEffect, useState } from "react";
import api from "../scripts/api";
import { fetchUsers } from "../endpoints/UserHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";

type Course = {
    id: number;
    name: string;
    description?: string | null;
    ownerId?: number | null;
    owner?: { id?: number; username?: string } | null;
    version?: number;
    tags?: string[];
    enrolled?: boolean;
    forkable?: boolean;
    [key: string]: any;
};

export default function HomePage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileUserType, setProfileUserType] = useState<"educator" | "learner" | "student" | undefined>(undefined);
    const isLoggedIn = userSession !== null;

    useEffect(() => {
        if (!isLoggedIn) return;

        let cancelled = false;

        async function fetchCoursesForUser() {
            setLoading(true);
            try {
                let userId: number | null = null;
                let userType: "educator" | "learner" | undefined = undefined;

                if (userSession) {
                    const lookupId = userSession.username || userSession.email;
                    const usersRes = await fetchUsers(lookupId);
                    if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
                        const currentUser = usersRes.ok.find((user: any) => 
                            user.username === userSession.username || 
                            user.email === userSession.email
                        );
                        
                        if (currentUser) {
                            userId = currentUser.id;
                            userType = currentUser.userType === 'EDUCATOR' ? 'educator' : 'learner';
                            setProfileUserType(userType);
                        }
                    }
                }

                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                if (userId != null && userType) {
                    if (userType === 'educator') {
                        const myCourses = Array.isArray(data)
                            ? data.filter((c: Course) => c.ownerId === userId || (c.owner && c.owner.id === userId))
                            : [];
                        setCourses(myCourses.slice(0, 5));
                    } else {
                        const featuredCourses = Array.isArray(data) 
                            ? data.filter((c: Course) => c.tags && c.tags.includes("featured")).slice(0, 3)
                            : data.slice(0, 3);
                        setCourses(featuredCourses);
                    }
                } else {
                    setCourses([]);
                }
            } catch (err: any) {
                setCourses([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchCoursesForUser();
        return () => {
            cancelled = true;
        };
    }, [userSession, isLoggedIn]);

    const isEducator = profileUserType === 'educator';

    const getWelcomeMessage = () => {
        if (isEducator) {
            return "Ready to inspire the next generation of learners?";
        } else {
            return "Your learning adventure continues — explore, discover, and grow.";
        }
    };

    const handleCourseClick = (courseId: number) => {
        if (isEducator) {
            navigate(`/course/${courseId}/edit`);
        } else {
            navigate(`/course/${courseId}`);
        }
    };

    return (
        <Page title="Quark | Home" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-12 py-16 text-gray-200">
                {!isLoggedIn ? (
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
                            {getWelcomeMessage()}
                        </p>

                        <section className="grid grid-cols-3 gap-6 mb-16">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">Recent Activity</p>
                            </div>

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

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white">
                                    {isEducator ? "Your Courses" : "Featured Courses"}
                                </h2>
                                <Link 
                                    to={isEducator ? "/my-courses" : "/marketplace"}
                                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                >
                                    {isEducator ? "View all courses →" : "Browse Marketplace →"}
                                </Link>
                            </div>

                            {loading ? (
                                <LoadingSkeleton count={3} variant="list" showEditButton={isEducator} />
                            ) : courses && courses.length > 0 ? (
                                <div className="space-y-4">
                                    {courses.map((course) => (
                                        <div 
                                            key={course.id} 
                                            onClick={() => handleCourseClick(course.id)}
                                            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-white mb-2">
                                                        {course.name}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">
                                                        {course.description ?? "No description provided."}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2 ml-6">
                                                    {isEducator ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/course/${course.id}/edit`);
                                                                }}
                                                                className="px-4 py-2 border border-white/20 rounded-lg text-white/80 hover:bg-white/5 transition"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/course/${course.id}`);
                                                                }}
                                                                className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
                                                            >
                                                                Open
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/course/${course.id}`);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
                                                        >
                                                            Start
                                                        </button>
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
                                            <p className="mb-4">No featured courses available.</p>
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