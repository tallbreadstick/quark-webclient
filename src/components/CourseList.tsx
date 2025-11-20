import { useEffect, useState } from "react";
import api from "../scripts/api";
import CourseCard from "./CourseCard";
import { getUserCourses } from "../utils/courseUtils";

type Course = {
    id: number;
    name: string;
    description?: string | null;
    ownerId?: number | null;
    owner?: { id?: number; username?: string } | null;
    version?: number;
    [key: string]: any;
};

export default function CourseList({
    userId,
    maxItems = 3,
    className = "",
    scrollable = false,
    maxHeightClass = "max-h-80",
}: {
    userId?: number | null;
    maxItems?: number;
    className?: string;
    scrollable?: boolean;
    maxHeightClass?: string;
}) {
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchCourses() {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get("/course");
                const data = res.data;

                if (cancelled) return;

                if (userId != null) {
                    // Use the shared utility function
                    const mine = getUserCourses(data, userId, 'educator');
                    setCourses(mine.slice(0, maxItems));
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
    }, [userId, maxItems]);

    const baseCard = `bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl ${className}`;
    const centeredClasses = `${baseCard} h-40 flex flex-col justify-center items-center`;
    const listClasses = `${baseCard} p-4 ${scrollable ? `${maxHeightClass} overflow-auto` : "h-40 overflow-hidden"}`;

    if (loading)
        return (
            <div className={scrollable ? listClasses : centeredClasses}>
                <div className="text-gray-400">Loading courses...</div>
            </div>
        );

    if (error)
        return (
            <div className={scrollable ? listClasses : centeredClasses}>
                <div className="text-red-400">Error loading courses</div>
            </div>
        );

    if (!courses || courses.length === 0)
        return (
            <div className={scrollable ? listClasses : centeredClasses}>
                <span className="text-gray-400">No courses yet.</span>
                <p className="mt-2 text-sm text-gray-500">Create one from your courses dashboard.</p>
            </div>
        );

    return (
        <div className={listClasses}>
            <ul className="space-y-2 text-left">
                {courses.map((course) => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        variant="compact"
                    />
                ))}
            </ul>
        </div>
    );
}