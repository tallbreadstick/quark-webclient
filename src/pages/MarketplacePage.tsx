import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loadSessionState } from "../types/UserSession";
import Page from "../components/page/Page";

type Course = {
    id: number;
    name: string;
    description: string;
    owner: {
        username: string;
    };
    tags: string[];
    enrolled: boolean;
};

export default function MarketplacePage() {
    const { userSession, setUserSession } = loadSessionState();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 9;

    useEffect(() => {
        setTimeout(() => {
            setCourses([
                {
                    id: 1, name: "Data Structures and Algorithms", description: "Master fundamental data structures and algorithmic thinking",
                    owner: { username: "tallbreadstick" }, tags: ["Computer Science", "Programming"], enrolled: false
                },
                {
                    id: 2, name: "Quantum Mechanics Fundamentals", description: "Explore the quantum world through interactive simulations",
                    owner: { username: "Dr. Physics" }, tags: ["Physics", "Quantum"], enrolled: false
                },
                {
                    id: 3, name: "Machine Learning Basics", description: "Introduction to machine learning concepts and applications",
                    owner: { username: "AI Educator" }, tags: ["AI", "Programming"], enrolled: false
                },
                {
                    id: 4, name: "Calculus and Analysis", description: "Deep dive into calculus with visual proofs and examples",
                    owner: { username: "Math Wizard" }, tags: ["Mathematics", "Calculus"], enrolled: false
                },
                {
                    id: 5, name: "Object-Oriented Programming", description: "at kern gumonan's favorite class",
                    owner: { username: "tallbreadstick" }, tags: ["Programming", "OOP"], enrolled: false
                },
                {
                    id: 6, name: "Data Analytics", description: "marriage between quantitative methods and programming",
                    owner: { username: "tallbreadstick" }, tags: ["Data Science", "Statistics"], enrolled: false
                },
                {
                    id: 7, name: "Differential Equations", description: "calculus topics",
                    owner: { username: "tallbreadstick" }, tags: ["Mathematics", "Calculus"], enrolled: false
                },
                {
                    id: 8, name: "Web Development", description: "Build modern web applications",
                    owner: { username: "Web Master" }, tags: ["Programming", "Web"], enrolled: false
                },
                {
                    id: 9, name: "Database Systems", description: "Learn SQL and database design",
                    owner: { username: "DB Expert" }, tags: ["Computer Science", "Database"], enrolled: false
                },
                {
                    id: 10, name: "Mobile App Development", description: "Create iOS and Android apps",
                    owner: { username: "Mobile Dev" }, tags: ["Programming", "Mobile"], enrolled: false
                },
                {
                    id: 11, name: "Artificial Intelligence", description: "Advanced AI concepts and implementations",
                    owner: { username: "AI Researcher" }, tags: ["AI", "Computer Science"], enrolled: false
                },
                {
                    id: 12, name: "Cyber Security", description: "Protect systems from cyber threats",
                    owner: { username: "Security Expert" }, tags: ["Security", "Computer Science"], enrolled: false
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const allTags = Array.from(new Set(courses.flatMap(course => course.tags)));
    const filteredCourses = courses.filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedTag === "" || course.tags.includes(selectedTag))
    );

    // Pagination logic
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

    const handleEnroll = (courseId: number, courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;
        
        // Show enroll alert
        alert(`Successfully enrolled in "${courseName}"! You can now access this course from your My Courses page.`);
        
        // Update enrollment state
        setCourses(courses.map(course => 
            course.id === courseId ? { ...course, enrolled: !course.enrolled } : course
        ));
    };

    const handleFork = (courseId: number, courseName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userSession) return;
        
        // Show fork alert
        alert(`"${courseName}" has been added to your courses as a template! You can now customize it for your own use.`);
        
        // Add your fork logic here
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleCourseClick = (courseId: number) => {
        navigate(`/course/${courseId}`);
    };

    // Check user role
    const isEducator = userSession?.userType === 'educator';
    const isLearner = userSession?.userType === 'learner';

    // Get button text and action based on role
    const getActionButton = (course: Course) => {
        if (!userSession) return null;

        if (isLearner) {
            return (
                <button 
                    onClick={(e) => handleEnroll(course.id, course.name, e)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                    Enroll
                </button>
            );
        }

        if (isEducator) {
            return (
                <button 
                    onClick={(e) => handleFork(course.id, course.name, e)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                    Fork
                </button>
            );
        }

        return null;
    };

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

                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
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
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition"
                            />
                        </div>

                        <div className="lg:w-64 relative">
                            <select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-10 transition [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 cursor-pointer"
                            >
                                <option value="">All Tags</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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

                    <div className="flex gap-2 flex-wrap mb-6">
                        <button
                            onClick={() => setSelectedTag("")}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
                                selectedTag === "" 
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/50" 
                                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                            }`}
                        >
                            All
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
                                    selectedTag === tag 
                                    ? "bg-blue-500/20 text-blue-300 border-blue-500/50" 
                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center text-gray-400 py-12">Loading courses...</div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400">
                                    Showing {currentCourses.length} of {filteredCourses.length} courses
                                </span>
                                <div className="relative">
                                    <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 cursor-pointer">
                                        <option>Sort by: Newest</option>
                                        <option>Sort by: Popular</option>
                                        <option>Sort by: Name</option>
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
                                {currentCourses.map((course, index) => (
                                    <div 
                                        key={course.id} 
                                        onClick={() => handleCourseClick(course.id)}
                                        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer"
                                    >
                                        <div className="mb-4">
                                            <h3 className="text-xl font-semibold text-white mb-2 hover:text-blue-300 transition-colors">
                                                {course.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-3">{course.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {course.tags.map(tag => (
                                                    <span 
                                                        key={tag} 
                                                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTag(tag === selectedTag ? "" : tag);
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 text-sm">
                                                By {course.owner.username}
                                            </span>
                                            {userSession && getActionButton(course)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredCourses.length === 0 && (
                                <div className="text-center text-gray-400 py-12">
                                    No courses found matching your criteria.
                                </div>
                            )}

                            {/* Pagination with cursor pointers */}
                            {totalPages > 1 && (
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
                </div>
            </div>
        </Page>
    );
}