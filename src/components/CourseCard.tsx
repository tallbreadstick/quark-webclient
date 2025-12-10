import { Link } from "react-router-dom";

type CourseCardProps = {
    course: {
        id: number;
        name: string;
        description?: string | null;
        ownerId?: number | null;
        owner?: { id?: number; username?: string } | null;
        tags?: string[];
        enrolled?: boolean;
        forkable?: boolean;
        [key: string]: any;
    };
    userType?: 'educator' | 'learner' | 'student';
    onEnroll?: (courseId: number, courseName: string, e: React.MouseEvent) => void;
    onFork?: (courseId: number, courseName: string, e: React.MouseEvent) => void;
    onTagClick?: (tag: string) => void;
    selectedTag?: string;
    variant?: 'grid' | 'list' | 'compact';
    isLoggedIn?: boolean;
    isEducator?: boolean;
};

export default function CourseCard({ 
    course, 
    userType, 
    onEnroll, 
    onFork, 
    onTagClick,
    selectedTag,
    variant = 'grid',
    isLoggedIn = false,
    isEducator = false
}: CourseCardProps) {
    const isUserEducator = userType === 'educator' || isEducator;
    const isUserLearner = userType === 'learner';

    const getActionButton = () => {
        // Don't show any button if not logged in
        if (!isLoggedIn) {
            return null;
        }

        if (isUserLearner && onEnroll) {
            // Show different button based on enrollment status
            if (course.enrolled) {
                return (
                    <div className="px-4 py-2 border border-blue-500/50 text-blue-300 rounded-lg cursor-default">
                        Enrolled
                    </div>
                );
            }
            
            return (
                <button 
                    onClick={(e) => onEnroll(course.id, course.name, e)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                    Enroll
                </button>
            );
        }

        if (isUserEducator && onFork && course.forkable) {
            return (
                <button 
                    onClick={(e) => onFork(course.id, course.name, e)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                    Fork
                </button>
            );
        }

        return null;
    };

    const getOwnerButtons = () => {
        if (!isUserEducator) {
            return (
                <Link 
                    to={`/course/${course.id}/chapters`} 
                    className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
                >
                    {isUserLearner ? "Start" : "Open"}
                </Link>
            );
        }

        return (
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
        );
    };

    if (variant === 'list') {
        return (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {course.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {course.description ?? "No description provided."}
                        </p>
                    </div>
                    {isLoggedIn && (
                        <div className="flex gap-2 ml-6">
                            {getOwnerButtons()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <li className="flex items-center justify-between">
                <div className="overflow-hidden flex-1">
                    <div className="text-sm font-semibold text-white truncate">{course.name}</div>
                    <div className="text-xs text-gray-400 truncate">{course.description ?? ""}</div>
                </div>
                {isLoggedIn && (
                    <Link 
                        to={`/course/${course.id}/chapters`} 
                        className="ml-4 px-2 py-1 bg-[#3b82f6] rounded-md text-xs text-white hover:bg-blue-600 transition"
                    >
                        Open
                    </Link>
                )}
            </li>
        );
    }

    return (
        <div className={`h-full flex flex-col bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 ${isLoggedIn ? 'hover:transform hover:scale-105 cursor-pointer' : ''}`}>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTagClick?.(tag === selectedTag ? "" : tag);
                                }}
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30 transition-colors cursor-pointer"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <span className="text-gray-500 text-sm">
                    {isUserEducator
                        ? `Owner: ${course.owner?.username ?? course.ownerId ?? "—"}` 
                        : `By ${course.owner?.username ?? course.ownerId ?? "—"}`
                    }
                </span>
                {isLoggedIn && (
                    <div className="flex gap-2">
                        {onEnroll || onFork ? getActionButton() : getOwnerButtons()}
                    </div>
                )}
            </div>
        </div>
    );
}