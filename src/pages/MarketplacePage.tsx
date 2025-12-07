import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import type { MarketplaceCourse } from "../types/CourseTypes"; // Clean import
import Page from "../components/page/Page";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
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
    // allow selecting multiple tags for the server-side 'tags' param
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState("newest");
    const [order, setOrder] = useState<"desc" | "asc">("desc");
    const [myCourses, setMyCourses] = useState<boolean>(false);
    const [sharedWithMe, setSharedWithMe] = useState<boolean>(false);
    const [forkableOnly, setForkableOnly] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 9;

    useEffect(() => {
        let cancelled = false;

        const params: Record<string, string | undefined> = {
            search: searchTerm || undefined,
            tags: selectedTags.length ? selectedTags.join(",") : undefined,
            sort_by: sortBy || undefined,
            order: order || undefined,
            my_courses: myCourses ? String(myCourses) : undefined,
            shared_with_me: sharedWithMe ? String(sharedWithMe) : undefined,
            forkable: forkableOnly ? String(forkableOnly) : undefined,
            page: String(currentPage || 1)
        };

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchCourses(params, userSession?.jwt ?? "");
                if (!cancelled) {
                    if (res.status === "OK" && res.ok) {
                        // map server response to a shape usable by CourseCard
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
                        setCourses(mapped);
                    } else {
                        // API returned an error — show empty list
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
    }, [searchTerm, selectedTags, sortBy, order, currentPage, myCourses, sharedWithMe, forkableOnly, userSession]);

    useEffect(() => {
        if (!userSession) return;

        const lookupId = userSession.username || userSession.email;
        (async () => {
            try {
                const res = await fetchUsers(lookupId);
                if (res.status === "OK" && res.ok && res.ok.length > 0) {
                    // Find the exact matching user
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

    // Apply filters and sorting
    const searchFiltered = filterCourses(courses, searchTerm);
    // client-side tag filtering supports multi-tag OR match
    const tagFiltered = selectedTags.length > 0
        ? searchFiltered.filter(course => selectedTags.some(t => course.tags.includes(t)))
        : searchFiltered;
    const sorted = sortCourses(tagFiltered, sortBy);
    const currentCourses = paginate(sorted, currentPage, coursesPerPage);
    const totalPages = getTotalPages(sorted.length, coursesPerPage);

    const handleEnroll = (courseId: number, courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;

        alert(`Successfully enrolled in "${courseName}"! You can now access this course from your My Courses page.`);

        setCourses(courses.map(course =>
            course.id === courseId ? { ...course, enrolled: !course.enrolled } : course
        ));
    };

    const handleFork = (courseId: number, _courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;
        
        // Navigate directly to the fork page
        navigate(`/course/${courseId}/fork`);
    };

    const handleCourseClick = (courseId: number) => {
        navigate(`/course/${courseId}`);
    };

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
        setCurrentPage(1);
    };

    // Check user role
    const isEducator = profileUserType === 'educator';

    return (
        <Page title="Quark | Marketplace" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Course Marketplace</h1>
                        <p className="text-gray-400">
                            {isEducator
                                ? "Discover courses to use as templates for your own curriculum"
                                : "Discover and enroll in courses tailored to your learning journey"
                            }
                        </p>
                    </div>

                    {!userSession && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center">
                            <p className="text-gray-300 mb-4">Sign in to enroll in courses and track your progress</p>
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
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={order}
                                            onChange={(e) => setOrder(e.target.value as any)}
                                            className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer mr-2"
                                        >
                                            <option value="desc">Newest</option>
                                            <option value="asc">Oldest</option>
                                        </select>

                                        {userSession && isEducator && (
                                            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-300 mr-2">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={myCourses} onChange={(e) => setMyCourses(e.target.checked)} className="form-checkbox" />
                                                    <span>My courses</span>
                                                </label>
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={sharedWithMe} onChange={(e) => setSharedWithMe(e.target.checked)} className="form-checkbox" />
                                                    <span>Shared</span>
                                                </label>
                                            </div>
                                        )}

                                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-gray-300 mr-3">
                                            <input type="checkbox" checked={forkableOnly} onChange={(e) => setForkableOnly(e.target.checked)} className="form-checkbox" />
                                            <span>Forkable</span>
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                                        >
                                            <option value="newest">Sort by: Newest</option>
                                            <option value="popular">Sort by: Popular</option>
                                            <option value="name">Sort by: Name</option>
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
                                    <div key={course.id} onClick={() => handleCourseClick(course.id)} className="h-full">
                                        <CourseCard
                                            course={course}
                                            userType={profileUserType}
                                            onEnroll={handleEnroll}
                                            onFork={handleFork}
                                            onTagClick={handleTagClick}
                                            selectedTag={selectedTags[0] ?? ""}
                                            variant="grid"
                                        />
                                    </div>
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
                </div>
            </div>
        </Page>
    );
}