import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { fetchCourses, fetchCourseWithChapters } from "../endpoints/CourseHandler";
import { fetchUsers } from "../endpoints/UserHandler";
import { getEnrolledCourses } from "../endpoints/ProgressHandler";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
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
    const [showForkableOnly, setShowForkableOnly] = useState<boolean>(false);
    const coursesPerPage = 5;
    const [profileUserType, setProfileUserType] = useState<"educator" | "learner" | "student" | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        async function loadCourses() {
            setLoading(true);
            setError(null);
            try {
                if (!userSession) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // Fetch profile info first - FIXED: Find exact matching user
                const lookupId = userSession.username || userSession.email;
                const usersRes = await fetchUsers(lookupId);
                let normalized: "educator" | "learner" | undefined = undefined;
                
                if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
                    // Find the exact matching user - SAME AS MARKETPLACE
                    const currentUser = usersRes.ok.find((user: any) => 
                        user.username === userSession.username || 
                        user.email === userSession.email
                    );
                    
                    if (currentUser) {
                        normalized = currentUser.userType === 'EDUCATOR' ? 'educator' : 'learner';
                        setProfileUserType(normalized);
                    }
                }

                // Fetch courses - ADD USER TYPE FILTER
                const params: Record<string, string | undefined> = { 
                    page: String(currentPage),
                    // Add user type specific filtering
                    ...(normalized === 'educator' && { my_courses: 'true' }),
                    // Add forkable filter for educators
                    ...(normalized === 'educator' && showForkableOnly && { forkable: 'true' })
                };
                
                // For learners: fetch enrolled courses via progress API
                if (normalized === 'learner') {
                    try {
                        const enrolledRes = await getEnrolledCourses(userSession.jwt ?? "");

                        if (enrolledRes.status === "OK" && enrolledRes.ok && enrolledRes.ok.length > 0) {
                            // Enrolled items may only contain courseId; fetch course details for each
                            const courseDetails = await Promise.all(
                                enrolledRes.ok.map(async (p: any) => {
                                    const courseId = p.courseId ?? p.id ?? (p.course && p.course.id);
                                    if (!courseId) return null;

                                    const courseRes = await fetchCourseWithChapters(courseId, userSession.jwt ?? "");
                                    if (courseRes.status === "OK" && courseRes.ok) {
                                        const c: any = courseRes.ok;
                                        return {
                                            ...c,
                                            owner: { username: c.owner ?? "—" },
                                            forkable: Boolean(c.forkable)
                                        } as DatabaseCourse;
                                    }

                                    // Fallback minimal shape
                                    return {
                                        id: courseId,
                                        name: p.courseName ?? p.name ?? "Unnamed Course",
                                        description: p.description ?? "",
                                        owner: { username: p.owner ?? "—" },
                                        forkable: Boolean(p.forkable)
                                    } as DatabaseCourse;
                                })
                            );

                            const filtered = courseDetails.filter(Boolean) as DatabaseCourse[];
                            setCourses(filtered);
                        } else {
                            setCourses([]);
                        }

                        setLoading(false);
                        return;
                    } catch (errLearner: any) {
                        if (!cancelled) setError(errLearner?.message || "Failed to load enrolled courses");
                        if (!cancelled) setCourses([]);
                        if (!cancelled) setLoading(false);
                        return;
                    }
                }
                
                const res = await fetchCourses(params, userSession.jwt ?? "");
                const data = res.status === "OK" && res.ok ? res.ok : [];

                if (cancelled) return;

                // Map courses to include owner info and forkable status
                const coursesWithOwners: DatabaseCourse[] = await Promise.all(
                    data.map(async (c: any) => {
                        const ownerUsername = c.owner || "—";
                        return {
                            ...c,
                            owner: { username: ownerUsername },
                            forkable: Boolean(c.forkable)
                        };
                    })
                );

                // Client-side filtering as backup for forkable
                let filteredCourses = coursesWithOwners;
                if (normalized === 'educator' && showForkableOnly) {
                    filteredCourses = coursesWithOwners.filter(course => course.forkable);
                }

                setCourses(filteredCourses);
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Failed to load courses");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadCourses();
        return () => { cancelled = true; };
    }, [userSession, currentPage, showForkableOnly]);

    const canCreateCourse = profileUserType === 'educator';
    const isEducator = profileUserType === 'educator';

    const filtered = filterCourses(courses || [], searchTerm);
    const sorted = sortCourses(filtered, sortBy);
    const currentCourses = paginate(sorted, currentPage, coursesPerPage);
    const totalPages = getTotalPages(sorted.length, coursesPerPage);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleSortChange = (value: string) => {
        if (value === "forkable") {
            setShowForkableOnly(true);
            setSortBy("newest");
        } else {
            setSortBy(value);
            setShowForkableOnly(false);
        }
        setCurrentPage(1);
    };

    return (
        <Page title="Quark | My Courses" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                        <p className="text-gray-400">
                            {profileUserType === 'educator'
                                ? "Manage and create your courses"
                                : "To view your enrolled or managed courses, sign in first"
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
                            icon={<FontAwesomeIcon icon={faLock} />}
                        >
                            <div className="flex justify-center gap-3 mt-4">
                                <Link to="/login" className="px-4 py-2 border border-[#566fb8] rounded-lg hover:bg-blue-500 hover:text-white transition font-semibold cursor-pointer">
                                    Sign in
                                </Link>
                                <Link to="/register" className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition cursor-pointer">
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
                                    message={canCreateCourse 
                                        ? "You don't have any courses yet." 
                                        : "You haven't enrolled in any courses yet."
                                    }
                                    actionText={canCreateCourse ? "Create your first course" : "Browse Courses"}
                                    actionLink={canCreateCourse ? "/my-courses/create" : "/marketplace"}
                                />
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-gray-400">
                                            {profileUserType === 'educator' 
                                                ? `Showing ${currentCourses.length} of ${sorted.length} courses you created`
                                                : `Showing ${currentCourses.length} of ${sorted.length} courses you're enrolled in`
                                            }
                                        </span>
                                        <div className="relative">
                                            <select
                                                value={showForkableOnly ? "forkable" : sortBy}
                                                onChange={(e) => handleSortChange(e.target.value)}
                                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition hover:bg-blue-500/10 hover:border-blue-500/30 [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 [&>option:hover]:bg-blue-500 cursor-pointer"
                                                style={{
                                                    minWidth: "180px"
                                                }}
                                            >
                                                <option value="newest">Sort by: Newest</option>
                                                <option value="oldest">Sort by: Oldest</option>
                                                <option value="name">Sort by: Name</option>
                                                {isEducator && <option value="forkable">Show: Forkable Only</option>}
                                            </select>
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

                                    <div className="space-y-4 mb-8">
                                        {currentCourses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                userType={profileUserType}
                                                variant="list"
                                                isLoggedIn={!!userSession}
                                                isEducator={isEducator}
                                            />
                                        ))}
                                    </div>

                                    {sorted.length === 0 && (
                                        <div className="text-center text-gray-400 py-12">
                                            {showForkableOnly 
                                                ? "No forkable courses found matching your criteria." 
                                                : "No courses found matching your criteria."
                                            }
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