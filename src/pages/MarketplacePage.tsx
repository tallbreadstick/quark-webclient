import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";
import CourseCard from "../components/CourseCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import { mockCourses } from "../data/marketplaceData"; 
import type { MarketplaceCourse } from "../types/CourseTypes";
import { filterCourses, filterByTag, getUniqueTags, paginate, getTotalPages, sortCourses } from "../utils/courseUtils";

export default function MarketplacePage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 9;

    useEffect(() => {
        setTimeout(() => {
            setCourses(mockCourses);
            setLoading(false);
        }, 1000);
    }, []);

    const allTags = getUniqueTags(courses);
    
    // Apply filters and sorting
    const searchFiltered = filterCourses(courses, searchTerm);
    const tagFiltered = filterByTag(searchFiltered, selectedTag);
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

    const handleFork = (courseId: number, courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;
        
        alert(`"${courseName}" has been added to your courses as a template! You can now customize it for your own use.`);
    };

    const handleCourseClick = (courseId: number) => {
        navigate(`/course/${courseId}`);
    };

    const isEducator = userSession?.userType === 'educator';

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
                                <Link to="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white hover:bg-[#475a9c] transition cursor-pointer">
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
                        onSearchChange={setSearchTerm}
                        selectedTag={selectedTag}
                        allTags={allTags}
                        onTagSelect={setSelectedTag}
                        searchPlaceholder="Search courses..."
                    />

                    {loading ? (
                        <div className="text-center text-gray-400 py-12">Loading courses...</div>
                    ) : (
                        <>
                            {/* This section matches your original layout - showing count and sort on same line */}
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
                                    <div key={course.id} onClick={() => handleCourseClick(course.id)}>
                                        <CourseCard
                                            course={course}
                                            userType={userSession?.userType}
                                            onEnroll={handleEnroll}
                                            onFork={handleFork}
                                            onTagClick={setSelectedTag}
                                            selectedTag={selectedTag}
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