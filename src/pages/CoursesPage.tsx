import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
// api import removed - using typed endpoint below
import { fetchCourses } from "../endpoints/CourseHandler";
import { fetchUsers } from "../endpoints/UserHandler";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { filterCourses, sortCourses, paginate, getTotalPages } from "../utils/courseUtils";
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

    const [profileUserType, setProfileUserType] = useState<"educator" | "learner" | "student" | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        async function loadCourses() {
            setLoading(true);
            setError(null);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (!userSession) {
                    // anonymous user -> no personal courses
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // First fetch profile so we know user id / type
                const usersRes = await fetchUsers(userSession?.username || userSession?.email || "");
                let normalized: "educator" | "learner" | undefined = undefined;
                if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
                    const profile = usersRes.ok[0];
                    // profile.id is available but not required here — server will return the user's courses
                    normalized = profile.userType === 'EDUCATOR' ? 'educator' : 'learner';
                    setProfileUserType(normalized);
                }

                // Ask the server to return only the courses that belong to the current user
                const params: Record<string, string | undefined> = { my_courses: 'true', page: String(currentPage) };
                const res = await fetchCourses(params, userSession?.jwt ?? "");
                const data = res.status === "OK" && res.ok ? res.ok : [];

                if (cancelled) return;

                    if (userSession) {
                        // server already returned only the user's courses (my_courses=true)
                        const normalizedInput = data as any as DatabaseCourse[];
                        setCourses(normalizedInput);
                    } else {
                        setCourses([]);
                    }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Failed to load courses");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadCourses();
        return () => {
            cancelled = true;
        };
    }, [userSession]);

    const canCreateCourse = profileUserType === 'educator';
    

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
    // (Left as a small helper for future use) -- not needed right now so keep logic inline where required

    return (
        <Page title="Quark | My Courses" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                        <p className="text-gray-400">
                            {profileUserType === 'educator'
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
                                                userType={profileUserType}
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