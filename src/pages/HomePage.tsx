import { motion } from "framer-motion";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../scripts/api";
import { fetchUsers } from "../endpoints/UserHandler";
import CourseCard from "../components/CourseCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { getUserCourses } from "../utils/courseUtils";

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
    const [profileUserType, setProfileUserType] = useState<"educator" | "learner" | "student" | undefined>(undefined);
    const isLoggedIn = userSession !== null;

    useEffect(() => {
        if (!isLoggedIn) return;

        let cancelled = false;

        async function fetchCoursesForUser() {
            setLoading(true);
            try {
                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                // if session is slim (only jwt/username/email) try fetching full profile
                let userId: number | null = null;
                let userType: string | null = null;

                if (userSession) {
                    const lookupId = userSession.username || userSession.email;
                    const usersRes = await fetchUsers(lookupId);
                    if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
                        const profile = usersRes.ok[0];
                        userId = profile.id;
                        userType = profile.userType;
                        // normalize backend role strings (EDUCATOR/STUDENT) to lowercase values used in UI
                        const normalized = profile.userType === 'EDUCATOR' ? 'educator' : 'learner';
                        setProfileUserType(normalized);
                    }
                }

                if (userId != null) {
                    const userCourses = getUserCourses(data, userId, userType ?? undefined);
                    setCourses(userCourses.slice(0, 2)); // Limit to 2 courses
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

        fetchCoursesForUser();
        return () => {
            cancelled = true;
        };
    }, [userSession, isLoggedIn]);

    // user type is no longer stored on the session; use profileUserType fetched above when available
    const isEducator = profileUserType === 'educator';
    const isLearner = profileUserType === 'learner';

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

                        {/* Quick Access / Dashboard Section */}
                        <section className="grid grid-cols-3 gap-6 mb-16">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">Recent Activity</p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">
                                    {isEducator ? "Course Analytics" : "Learning Progress"}
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">
                                    {isEducator ? "Student Engagement" : "Learning Tracks"}
                                </p>
                            </div>
                        </section>

                        {/* Your Courses section */}
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
                                <LoadingSkeleton count={2} variant="list" showEditButton={isEducator} />
                            ) : courses && courses.length > 0 ? (
                                <div className="space-y-4">
                                    {courses.map((course) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            userType={profileUserType}
                                            variant="list"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    message={isEducator ? "You don't have any courses yet." : "You haven't enrolled in any courses yet."}
                                    actionText={isEducator ? "Create your first course" : "Browse Courses"}
                                    actionLink={isEducator ? "/my-courses/create" : "/marketplace"}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </Page>
    );
}