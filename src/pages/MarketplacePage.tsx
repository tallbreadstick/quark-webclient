import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import type { MarketplaceCourse } from "../types/CourseTypes";
import Page from "../components/page/Page";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import AlertModal from "../components/modals/AlertModal";
import { fetchCourses } from "../endpoints/CourseHandler";
import { enrollInCourse } from "../endpoints/ProgressHandler";
import { filterCourses, getUniqueTags, paginate, getTotalPages, sortCourses } from "../utils/courseUtils";
import { fetchUsers } from "../endpoints/UserHandler";

// ICONS FOR LOGGED OUT
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

export default function MarketplacePage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();

    const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
    const [loading, setLoading] = useState(true);

    const [profileUserType, setProfileUserType] = useState<
        "educator" | "learner" | undefined
    >(undefined);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [showForkableOnly, setShowForkableOnly] = useState(false);

    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [enrolledCourseName, setEnrolledCourseName] = useState("");

    const coursesPerPage = 9;

    /* Load Courses */
    useEffect(() => {
        let cancelled = false;

        const params: Record<string, string | undefined> = {
            search: searchTerm || undefined,
            tags: selectedTags.length ? selectedTags.join(",") : undefined,
            page: String(currentPage || 1),
        };

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

        const isEducator = profileUserType === "educator";
        if (isEducator && showForkableOnly && userSession) {
            params.forkable = "true";
        }

        const load = async () => {
            setLoading(true);
            try {
                const jwt = userSession?.jwt ?? "";
                const res = await fetchCourses(params, jwt);

                if (!cancelled) {
                    if (res.status === "OK") {
                        const mapped = res.ok.map((c: any) => {
                            const tags = Array.isArray(c.tags)
                                ? c.tags.map((t: any) =>
                                      typeof t === "string"
                                          ? t
                                          : t?.name ?? String(t?.id ?? "")
                                  )
                                : [];

                            return {
                                id: c.id,
                                name: c.name,
                                description: c.description ?? "",
                                tags,
                                enrolled: false,
                                forkable: Boolean(c.forkable),
                                owner: { username: c.owner ?? "—" },
                            };
                        });

                        let filtered = mapped;
                        if (isEducator && showForkableOnly) {
                            filtered = mapped.filter((c) => c.forkable);
                        }

                        setCourses(filtered);
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

    /* Detect User Type */
    useEffect(() => {
        if (!userSession) {
            setProfileUserType(undefined);
            return;
        }

        const lookupId = userSession.username || userSession.email;

        (async () => {
            try {
                const res = await fetchUsers(lookupId);

                if (res.status === "OK" && res.ok.length > 0) {
                    const user = res.ok.find(
                        (u: any) =>
                            u.username === userSession.username ||
                            u.email === userSession.email
                    );
                    if (user) {
                        setProfileUserType(
                            user.userType === "EDUCATOR" ? "educator" : "learner"
                        );
                    }
                }
            } catch {}
        })();
    }, [userSession]);

    const allTags = getUniqueTags(courses);
    const isEducator = profileUserType === "educator";

    /* Filtering + Sorting */
    const filtered = filterCourses(courses, searchTerm);
    const tagFiltered =
        selectedTags.length > 0
            ? filtered.filter((c) =>
                  selectedTags.some((tag) => c.tags.includes(tag))
              )
            : filtered;

    const sorted = sortCourses(tagFiltered, sortBy);
    const currentCourses = paginate(sorted, currentPage, coursesPerPage);
    const totalPages = getTotalPages(sorted.length, coursesPerPage);

    /* Enroll */
    const handleEnroll = async (courseId: number, name: string, e: any) => {
        e.stopPropagation();
        if (!userSession) return;

        try {
            const result = await enrollInCourse(courseId, userSession.jwt ?? "");

            if (result.status === "OK") {
                setCourses((prev) =>
                    prev.map((c) =>
                        c.id === courseId ? { ...c, enrolled: true } : c
                    )
                );
                setEnrolledCourseName(name);
                setShowEnrollmentModal(true);
            }
        } catch (e) {
            alert("Failed to enroll.");
        }
    };

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter((t) => t !== tag)
                : [...prev, tag]
        );
        setCurrentPage(1);
    };

    /* Render */
    return (
        <Page title="Quark | Marketplace" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-7xl mx-auto">

                    {/* HEADER */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Course Marketplace</h1>
                        <p className="text-gray-400">
                            {!userSession
                                ? "Discover courses — sign in to enroll and track your progress"
                                : isEducator
                                ? "Discover courses to use as templates for your curriculum"
                                : "Find and enroll in courses for your learning journey"}
                        </p>
                    </div>

                    {/* 🔒 LOGGED OUT UI SECTION WITH ICON */}
                    {!userSession && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center">

                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/30 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faLock} className="text-gray-500 text-3xl" />
                            </div>

                            <p className="text-gray-300 mb-4">
                                Sign in to enroll in courses, make courses, and track your progress
                            </p>

                            <div className="flex justify-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition cursor-pointer"
                                >
                                    Sign in
                                </Link>

                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition cursor-pointer"
                                >
                                    Register
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* SEARCH BAR */}
                    <SearchFilterBar
                        searchTerm={searchTerm}
                        onSearchChange={(v) => {
                            setSearchTerm(v);
                            setCurrentPage(1);
                        }}
                        selectedTag={selectedTags[0] ?? ""}
                        allTags={allTags}
                        onTagSelect={handleTagClick}
                        searchPlaceholder="Search courses..."
                    />

                    {/* LOADING */}
                    {loading ? (
                        <div className="text-center text-gray-400 py-12">Loading courses...</div>
                    ) : (
                        <>
                            {/* SORT BAR */}
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400">
                                    Showing {currentCourses.length} of {sorted.length} courses
                                </span>

                                <div className="relative">
                                    <select
                                        value={showForkableOnly ? "forkable" : sortBy}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "forkable") {
                                                setShowForkableOnly(true);
                                                setSortBy("newest");
                                            } else {
                                                setShowForkableOnly(false);
                                                setSortBy(val);
                                            }
                                            setCurrentPage(1);
                                        }}
                                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer"
                                    >
                                        <option value="newest">Sort by: Newest</option>
                                        <option value="oldest">Sort by: Oldest</option>
                                        <option value="name">Sort by: Name</option>
                                        {userSession && isEducator && (
                                            <option value="forkable">Show: Forkable Only</option>
                                        )}
                                    </select>

                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg
                                            className="h-4 w-4 text-blue-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* COURSE GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {currentCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() =>
                                            userSession && navigate(`/course/${course.id}`)
                                        }
                                        className={`h-full ${userSession ? "cursor-pointer" : ""}`}
                                    >
                                        <CourseCard
                                            course={course}
                                            userType={profileUserType}
                                            onEnroll={handleEnroll}
                                            onFork={(id, name, e) => {
                                                e.stopPropagation();
                                                if (userSession) navigate(`/course/${id}/fork`);
                                            }}
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
                                    No courses match your criteria.
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

            {/* ENROLL SUCCESS MODAL */}
            <AlertModal
                isOpen={showEnrollmentModal}
                onClose={() => setShowEnrollmentModal(false)}
                title="Enrollment Successful!"
                message={
                    <>
                        <p>You've successfully enrolled in "{enrolledCourseName}".</p>
                        <p className="text-sm text-gray-400 mt-2">
                            You can now access this course from your My Courses page.
                        </p>
                    </>
                }
                variant="success"
                buttonText="Got it!"
            />
        </Page>
    );
}
