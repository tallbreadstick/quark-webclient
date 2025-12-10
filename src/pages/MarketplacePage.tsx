import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import type { MarketplaceCourse } from "../types/CourseTypes";
import Page from "../components/page/Page";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import EnrollmentSuccessModal from "../components/EnrollmentSuccessModal";
import { fetchCourses } from "../endpoints/CourseHandler";
import { filterCourses, getUniqueTags, paginate, getTotalPages, sortCourses } from "../utils/courseUtils";
import { fetchUsers } from "../endpoints/UserHandler";

export default function MarketplacePage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileUserType, setProfileUserType] = useState<"educator" | "learner" | "student" | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [showForkableOnly, setShowForkableOnly] = useState<boolean>(false);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [enrolledCourseName, setEnrolledCourseName] = useState("");
    const coursesPerPage = 9;

    useEffect(() => {
        let cancelled = false;

        // Build params object based on user type
        const params: Record<string, string | undefined> = {
            search: searchTerm || undefined,
            tags: selectedTags.length ? selectedTags.join(",") : undefined,
            page: String(currentPage || 1)
        };

        // Add sort_by based on sortBy state
        if (sortBy === "newest") {
            params.sort_by = "created_at";
            params.order = "desc";
        } else if (sortBy === "oldest") {
            params.sort_by = "created_at";
            params.order = "asc";
        } else if (sortBy === "name") {
            params.sort_by = "name";
            params.order = "asc";
        }

        // Add forkable filter for educators when showForkableOnly is true
        const isEducator = profileUserType === 'educator';
        if (isEducator && showForkableOnly && userSession) {
            params.forkable = "true";
        }

        const load = async () => {
            setLoading(true);
            try {
                // Allow fetching courses without JWT for logged-out users
                const jwt = userSession?.jwt ?? "";
                const res = await fetchCourses(params, jwt);
                if (!cancelled) {
                    if (res.status === "OK" && res.ok) {
                        const mapped = res.ok.map(c => {
                            const rawTags = (c as any).tags ?? [];
                            const tags = Array.isArray(rawTags)
                                ? rawTags.map((t: any) => typeof t === "string" ? t : (t?.name ?? String(t?.id ?? "")))
                                : [];

                            return {
                                id: c.id,
                                name: c.name,
                                description: c.description ?? "",
                                tags,
                                enrolled: false,
                                forkable: Boolean((c as any).forkable),
                                owner: { username: (c as any).owner ?? "—" }
                            };
                        });
                        
                        // Client-side filtering as backup
                        let filteredCourses = mapped;
                        if (isEducator && showForkableOnly && userSession) {
                            filteredCourses = mapped.filter(course => course.forkable);
                        }
                        
                        setCourses(filteredCourses);
                    } else {
                        setCourses([]);
                    }
                }
            } catch (e) {
                if (!cancelled) setCourses([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [searchTerm, selectedTags, sortBy, currentPage, userSession, profileUserType, showForkableOnly]);

    useEffect(() => {
        if (!userSession) {
            setProfileUserType(undefined);
            return;
        }

        const lookupId = userSession.username || userSession.email;
        (async () => {
            try {
                const res = await fetchUsers(lookupId);
                if (res.status === "OK" && res.ok && res.ok.length > 0) {
                    const currentUser = res.ok.find((user: any) => 
                        user.username === userSession.username || 
                        user.email === userSession.email
                    );
                    
                    if (currentUser) {
                        setProfileUserType(currentUser.userType === 'EDUCATOR' ? 'educator' : 'learner');
                    }
                }
            } catch (e) {
                // ignore
            }
        })();
    }, [userSession]);

    const allTags = getUniqueTags(courses);
    const isEducator = profileUserType === 'educator';

    // Apply filters and sorting
    const searchFiltered = filterCourses(courses, searchTerm);
    const tagFiltered = selectedTags.length > 0
        ? searchFiltered.filter(course => selectedTags.some(t => course.tags.includes(t)))
        : searchFiltered;
    const sorted = sortCourses(tagFiltered, sortBy);
    const currentCourses = paginate(sorted, currentPage, coursesPerPage);
    const totalPages = getTotalPages(sorted.length, coursesPerPage);

    const handleEnroll = async (courseId: number, courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;

        try {
            // TODO: Call enrollment API when ready
            // const result = await enrollInCourse(courseId, userSession.jwt ?? "");
            // if (result.status === "OK") { ... }
            
            // For now, just update UI
            setCourses(courses.map(course =>
                course.id === courseId ? { ...course, enrolled: true } : course
            ));

            // Show success modal
            setEnrolledCourseName(courseName);
            setShowEnrollmentModal(true);
        } catch (error: any) {
            alert(`Failed to enroll: ${error?.message || "Unknown error"}`);
        }
    };

    const handleCloseModal = () => {
        setShowEnrollmentModal(false);
        setEnrolledCourseName("");
    };

    const handleFork = (courseId: number, _courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;
        
        navigate(`/course/${courseId}/fork`);
    };

    const handleCourseClick = (courseId: number) => {
        // Only navigate if user is logged in
        if (userSession) {
            navigate(`/course/${courseId}`);
        }
    };

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
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
        <Page title="Quark | Marketplace" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Course Marketplace</h1>
                        <p className="text-gray-400">
                            {userSession ? (
                                isEducator
                                    ? "Discover courses to use as templates for your own curriculum"
                                    : "Discover and enroll in courses tailored to your learning journey"
                            ) : (
                                "Discover courses - sign in to enroll and track your progress"
                            )}
                        </p>
                    </div>

                    {!userSession && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center">
                            <p className="text-gray-300 mb-4">Sign in to enroll in courses, make courses, and track your progress</p>
                            <div className="flex justify-center gap-3">
                                <Link to="/login" className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition cursor-pointer">
                                    Sign in
                                </Link>
                                <Link to="/register" className="px-4 py-2 border border-white/20 rounded-md text-white/80 hover:bg-white/5 transition cursor-pointer">
                                    Register
                                </Link>
                            </div>
                        </div>
                    )}

                    <SearchFilterBar
                        searchTerm={searchTerm}
                        onSearchChange={(value) => {
                            setSearchTerm(value);
                            setCurrentPage(1);
                        }}
                        selectedTag={selectedTags[0] ?? ""}
                        allTags={allTags}
                        onTagSelect={handleTagClick}
                        searchPlaceholder="Search courses..."
                    />

                    {loading ? (
                        <div className="text-center text-gray-400 py-12">Loading courses...</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400">
                                    Showing {currentCourses.length} of {sorted.length} courses
                                </span>
                                <div className="flex items-center gap-3">
                                    {/* Single unified sort dropdown with forkable filter option */}
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
                                            {userSession && isEducator && <option value="forkable">Show: Forkable Only</option>}
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {currentCourses.map((course) => (
                                    <div 
                                        key={course.id} 
                                        onClick={() => handleCourseClick(course.id)} 
                                        className={`h-full ${userSession ? 'cursor-pointer' : ''}`}
                                    >
                                        <CourseCard
                                            course={course}
                                            userType={profileUserType}
                                            onEnroll={handleEnroll}
                                            onFork={handleFork}
                                            onTagClick={handleTagClick}
                                            selectedTag={selectedTags[0] ?? ""}
                                            variant="grid"
                                            isLoggedIn={!!userSession}
                                            isEducator={isEducator}
                                        />
                                    </div>
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
                </div>
            </div>

            {/* Enrollment Success Modal */}
            <EnrollmentSuccessModal
                isOpen={showEnrollmentModal}
                courseName={enrolledCourseName}
                onClose={handleCloseModal}
            />
        </Page>
    );
}