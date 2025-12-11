import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faBook, faPlus, faStore, faChartLine, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { useEffect, useState } from "react";
import { fetchUsers } from "../endpoints/UserHandler";
import { fetchCourses } from "../endpoints/CourseHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import type { DatabaseCourse } from "../types/CourseTypes";

export default function HomePage() {
    const { userSession, setUserSession } = loadSessionState();
    const [courses, setCourses] = useState<DatabaseCourse[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileUserType, setProfileUserType] = useState<"educator" | "learner" | "student" | undefined>(undefined);
    const isLoggedIn = userSession !== null;

    useEffect(() => {
        if (!isLoggedIn) return;

        let cancelled = false;

        async function fetchCoursesForUser() {
            setLoading(true);
            try {
                let userType: "educator" | "learner" | undefined = undefined;

                // Get user type
                if (userSession) {
                    const lookupId = userSession.username || userSession.email;
                    const usersRes = await fetchUsers(lookupId);
                    if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
                        const currentUser = usersRes.ok.find((user: any) => 
                            user.username === userSession.username || 
                            user.email === userSession.email
                        );
                        
                        if (currentUser) {
                            userType = currentUser.userType === 'EDUCATOR' ? 'educator' : 'learner';
                            setProfileUserType(userType);
                        }
                    }
                }

                // Fetch courses for educators
                if (userType === 'educator') {
                    // Use the same params as /my-courses page
                    const params = { my_courses: 'true' };
                    const res = await fetchCourses(params, userSession?.jwt ?? "");
                    const data = res.status === "OK" && res.ok ? res.ok : [];

                    if (cancelled) return;

                    if (data && data.length > 0) {
                        // Map data to DatabaseCourse format - SIMPLIFIED like /my-courses
                        const mappedCourses: DatabaseCourse[] = await Promise.all(
                            data.map(async (c: any) => {
                                const rawTags = (c as any).tags ?? [];
                                const tags = Array.isArray(rawTags)
                                    ? rawTags.map((t: any) => typeof t === "string" ? t : (t?.name ?? String(t?.id ?? "")))
                                    : [];

                                return {
                                    id: c.id,
                                    name: c.name,
                                    description: c.description ?? "",
                                    tags,
                                    forkable: Boolean((c as any).forkable),
                                    owner: { username: c.owner || "—" }, // Use c.owner directly
                                    ownerId: c.ownerId,
                                    version: c.version,
                                    createdAt: c.createdAt,
                                };
                            })
                        );

                        // Show only 2 most recent courses
                        const recentCourses = mappedCourses
                            .sort((a, b) => {
                                // Sort by created date if available, otherwise by ID
                                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
                                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
                                return dateB - dateA; // Most recent first
                            })
                            .slice(0, 2); // Limit to 2 courses

                        setCourses(recentCourses);
                    } else {
                        setCourses([]);
                    }
                } else {
                    // For learners/students: show empty (no enroll endpoint yet)
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

    const isEducator = profileUserType === 'educator';

    const getWelcomeMessage = () => {
        if (isEducator) {
            return "Ready to inspire the next generation of learners?";
        } else {
            return "Your learning adventure continues — explore, discover, and grow.";
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


                        {/* Quick Actions */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                            {isEducator ? (
                                <>
                                    <Link
                                        to="/my-courses/create"
                                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FontAwesomeIcon icon={faPlus} className="text-blue-400 text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">Create New Course</h3>
                                                <p className="text-sm text-gray-400">Start building your next course</p>
                                            </div>
                                        </div>
                                    </Link>
                                    <Link
                                        to="/my-courses"
                                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FontAwesomeIcon icon={faBook} className="text-purple-400 text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">Manage Courses</h3>
                                                <p className="text-sm text-gray-400">View and edit your courses</p>
                                            </div>
                                        </div>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/marketplace"
                                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FontAwesomeIcon icon={faStore} className="text-blue-400 text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">Browse Marketplace</h3>
                                                <p className="text-sm text-gray-400">Discover new courses to learn</p>
                                            </div>
                                        </div>
                                    </Link>
                                    <Link
                                        to="/my-courses"
                                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <FontAwesomeIcon icon={faGraduationCap} className="text-green-400 text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">My Courses</h3>
                                                <p className="text-sm text-gray-400">Continue your enrolled courses</p>
                                            </div>
                                        </div>
                                    </Link>
                                </>
                            )}
                        </section>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <FontAwesomeIcon icon={faClock} className="text-blue-400" />
                                    {isEducator ? "Your Recent Courses" : "Your Enrolled Courses"}
                                </h2>
                                <Link 
                                    to="/my-courses"
                                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                >
                                    {isEducator ? "View all courses →" : "Enrolled Courses →"}
                                </Link>
                            </div>

                            {loading ? (
                                <LoadingSkeleton count={2} variant="list" showEditButton={isEducator} />
                            ) : courses && courses.length > 0 ? (
                                <div className="space-y-4">
                                    {courses.map((course) => (
                                        <div 
                                            key={course.id}
                                            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300"
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
                                                            Open
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                                    <div className="text-4xl mb-4">📚</div>
                                    {isEducator ? (
                                        <>
                                            <p className="mb-4 text-lg">You haven't created any courses yet.</p>
                                            <Link to="/my-courses/create" className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition text-sm">
                                                Create your first course
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-4 text-lg">You haven't enrolled in any courses yet.</p>
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