import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
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

export default function CoursesPage() {
    const { userSession, setUserSession } = loadSessionState();
    const [courses, setCourses] = useState<Course[] | null>(null);
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
                // Simulate loading delay like Marketplace
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                // If userSession exists, filter courses based on user type
                if (userSession && userSession.id != null) {
                    if (userSession.userType === 'educator') {
                        // Educators see courses they own
                        const id = userSession.id;
                        const mine = Array.isArray(data)
                            ? data.filter((c: Course) => c.ownerId === id || (c.owner && c.owner.id === id))
                            : [];
                        setCourses(mine);
                    } else {
                        // Learners and students see courses they're enrolled in
                        // For now, show empty array since enrollment endpoint might not exist
                        setCourses([]);
                    }
                } else {
                    // If not logged in, show an empty list
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

    // Check if user can create courses (ONLY educators)
    const canCreateCourse = userSession?.userType === 'educator';
    const isLearner = userSession?.userType === 'learner' || userSession?.userType === 'student';

    // Filter courses based on search term
    const filteredCourses = (courses || []).filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort courses
    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case "name":
                return a.name.localeCompare(b.name);
            case "newest":
                return (b.id || 0) - (a.id || 0);
            case "popular":
                return (b.id || 0) - (a.id || 0);
            default:
                return 0;
        }
    });

    // Pagination logic
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = sortedCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Determine button text based on user type and course progress
    const getCourseButtonText = (course: Course) => {
        if (canCreateCourse) return "Open";
        if (isLearner) {
            // You can add logic here to check if user has started the course
            // For now, we'll use "Start" for all learner courses
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

                    {/* Search and Create Course Section */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-8">
                        {/* Search Bar - Takes remaining space */}
                        <div className="flex-1 relative">
                            <svg 
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search your courses..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition"
                            />
                        </div>

                        {/* Create Course Button - Same width as sort dropdown */}
                        {canCreateCourse && (
                            <div className="w-full lg:w-48">
                                <Link 
                                    to="/my-courses/create" 
                                    className="w-full px-4 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition flex items-center justify-center whitespace-nowrap"
                                >
                                    Create Course
                                </Link>
                            </div>
                        )}
                    </div>
                                
                    {!userSession ? (
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center">
                            <p className="text-gray-300 mb-4">You need to be signed in to view your courses.</p>
                            <div className="flex justify-center gap-3">
                                <Link to="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white hover:bg-[#475a9c] transition">
                                    Sign in
                                </Link>
                                <Link to="/register" className="px-4 py-2 border border-white/20 rounded-md text-white/80 hover:bg-white/5 transition">
                                    Register
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <section>
                            {loading ? (
                                <div className="text-center text-gray-400 py-12">Loading your courses...</div>
                            ) : error ? (
                                <div className="text-red-400 text-center py-12">Error: {error}</div>
                            ) : courses && courses.length === 0 ? (
                                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center text-gray-400">
                                    {canCreateCourse ? (
                                        <>
                                            <p className="mb-4">You don't have any courses yet.</p>
                                            <Link to="/my-courses/create" className="px-3 py-1 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition text-sm">
                                                Create your first course
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-4">You haven't enrolled in any courses yet.</p>
                                            <Link to="/marketplace" className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition text-white">
                                                Browse Courses
                                            </Link>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-gray-400">
                                            Showing {currentCourses.length} of {sortedCourses.length} courses
                                        </span>
                                        <div className="relative w-48">
                                            <select 
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600"
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

                                    {/* Loading Skeleton */}
                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                            {Array.from({ length: 6 }).map((_, index) => (
                                                <div 
                                                    key={index}
                                                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse"
                                                >
                                                    <div className="mb-4">
                                                        <div className="h-6 bg-white/10 rounded mb-2"></div>
                                                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="h-4 bg-white/10 rounded w-1/3"></div>
                                                        <div className="flex gap-2">
                                                            <div className="h-8 bg-white/10 rounded w-16"></div>
                                                            {canCreateCourse && (
                                                                <div className="h-8 bg-white/10 rounded w-12"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                {currentCourses.map((course) => (
                                                    <div 
                                                        key={course.id} 
                                                        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
                                                    >
                                                        <div className="mb-4">
                                                            <h3 className="text-xl font-semibold text-white mb-2 hover:text-blue-300 transition-colors">
                                                                {course.name}
                                                            </h3>
                                                            <p className="text-gray-400 text-sm mb-3">
                                                                {course.description ?? "No description provided."}
                                                            </p>
                                                            {course.tags && course.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {course.tags.map(tag => (
                                                                        <span 
                                                                            key={tag} 
                                                                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded transition-colors"
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-500 text-sm">
                                                                {canCreateCourse
                                                                    ? `Owner: ${course.owner?.username ?? course.ownerId ?? "—"}` 
                                                                    : `By: ${course.owner?.username ?? course.ownerId ?? "—"}`
                                                                }
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <Link 
                                                                    to={`/course/${course.id}`} 
                                                                    className="px-3 py-1 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
                                                                >
                                                                    {getCourseButtonText(course)}
                                                                </Link>
                                                                {canCreateCourse && (
                                                                    <Link 
                                                                        to={`/course/${course.id}/edit`} 
                                                                        className="px-3 py-1 border border-white/20 rounded-md text-white/80 hover:bg-white/5 transition"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {sortedCourses.length === 0 && (
                                                <div className="text-center text-gray-400 py-12">
                                                    No courses found matching your criteria.
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Pagination */}
                                    {!loading && totalPages > 1 && (
                                        <div className="flex justify-center items-center space-x-2 mt-8">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition cursor-pointer"
                                            >
                                                Previous
                                            </button>
                                            
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-2 border rounded-lg transition cursor-pointer ${
                                                        currentPage === page
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition cursor-pointer"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </Page>
    );
}