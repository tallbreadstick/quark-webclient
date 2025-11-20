import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import api from "../scripts/api";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { filterCourses, sortCourses, paginate, getTotalPages, getUserCourses } from "../utils/courseUtils";
import type { DatabaseCourse } from "../types/CourseTypes";

export default function CoursesPage() {
    const { userSession, setUserSession } = loadSessionState();
    const [courses, setCourses] = useState<DatabaseCourse[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("newest");
    const coursesPerPage = 9;

    useEffect(() => {
        let cancelled = false;

        async function fetchCourses() {
            setLoading(true);
            setError(null);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                if (userSession && userSession.id != null) {
                    const userCourses = getUserCourses(data, userSession.id, userSession.userType);
                    setCourses(userCourses);
                } else {
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

    const canCreateCourse = userSession?.userType === 'educator';
    const isLearner = userSession?.userType === 'learner';

    // Apply filters and sorting
    const filtered = filterCourses(courses || [], searchTerm);
    const sorted = sortCourses(filtered, sortBy);
    const currentCourses = paginate(sorted, currentPage, coursesPerPage);
    const totalPages = getTotalPages(sorted.length, coursesPerPage);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Determine button text based on user type and course progress
    const getCourseButtonText = (course: DatabaseCourse) => {
        if (canCreateCourse) return "Open";
        if (isLearner) {
            return "Start";
        }
        return "Open";
    };

    return (
        <Page title="Quark | My Courses" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                        <p className="text-gray-400">
                            {userSession?.userType === 'educator'
                                ? "Manage and create your courses" 
                                : "View your enrolled courses and learning progress"
                            }
                        </p>
                    </div>

                    <SearchFilterBar
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        showCreateButton={canCreateCourse}
                        createButtonLink="/my-courses/create"
                        createButtonText="Create Course"
                        searchPlaceholder="Search your courses..."
                    />
                                
                    {!userSession ? (
                        <EmptyState
                            message="You need to be signed in to view your courses."
                            icon="🔒"
                        >
                            <div className="flex justify-center gap-3 mt-4">
                                <Link to="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white hover:bg-[#475a9c] transition">
                                    Sign in
                                </Link>
                                <Link to="/register" className="px-4 py-2 border border-white/20 rounded-md text-white/80 hover:bg-white/5 transition">
                                    Register
                                </Link>
                            </div>
                        </EmptyState>
                    ) : (
                        <section>
                            {loading ? (
                                <LoadingSkeleton count={6} showEditButton={canCreateCourse} />
                            ) : error ? (
                                <div className="text-red-400 text-center py-12">Error: {error}</div>
                            ) : courses && courses.length === 0 ? (
                                <EmptyState
                                    message={canCreateCourse ? "You don't have any courses yet." : "You haven't enrolled in any courses yet."}
                                    actionText={canCreateCourse ? "Create your first course" : "Browse Courses"}
                                    actionLink={canCreateCourse ? "/my-courses/create" : "/marketplace"}
                                />
                            ) : (
                                <>
                                    {/* Sort dropdown inline with course count - matching original layout */}
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-gray-400">
                                            Showing {currentCourses.length} of {sorted.length} courses
                                        </span>
                                        <div className="relative">
                                            <select 
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 cursor-pointer"
                                            >
                                                <option value="newest">Sort by: Newest</option>
                                                <option value="popular">Sort by: Popular</option>
                                                <option value="name">Sort by: Name</option>
                                            </select>
                                            {/* Custom dropdown arrow for sort */}
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <svg 
                                                    className="h-4 w-4 text-gray-400" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {currentCourses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                userType={userSession.userType}
                                                variant="grid"
                                            />
                                        ))}
                                    </div>

                                    {sorted.length === 0 && (
                                        <div className="text-center text-gray-400 py-12">
                                            No courses found matching your criteria.
                                        </div>
                                    )}

                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </Page>
    );
}