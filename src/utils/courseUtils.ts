import type { AnyCourse, DatabaseCourse, MarketplaceCourse } from "../types/CourseTypes";

/**
 * Filter courses by search term - works with both types
 */
export function filterCourses(courses: AnyCourse[], searchTerm: string): AnyCourse[] {
    if (!searchTerm) return courses;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return courses.filter(course => 
        course.name.toLowerCase().includes(lowerSearchTerm) ||
        (course.description && course.description.toLowerCase().includes(lowerSearchTerm)) ||
        course.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
}

/**
 * Sort courses by specified criteria - works with both types
 */
export function sortCourses(courses: AnyCourse[], sortBy: string): AnyCourse[] {
    const sorted = [...courses];
    switch (sortBy) {
        case "name":
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "newest":
            return sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
        case "popular":
            return sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
        default:
            return sorted;
    }
}

/**
 * Filter courses by tag - works with both types
 */
export function filterByTag(courses: AnyCourse[], selectedTag: string): AnyCourse[] {
    if (!selectedTag) return courses;
    return courses.filter(course => course.tags.includes(selectedTag));
}

/**
 * Get unique tags from courses - works with both types
 */
export function getUniqueTags(courses: AnyCourse[]): string[] {
    const allTags = courses.flatMap(course => course.tags);
    return Array.from(new Set(allTags));
}

/**
 * Paginate array - generic utility
 */
export function paginate<T>(items: T[], page: number, itemsPerPage: number): T[] {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
}

/**
 * Calculate total pages - generic utility
 */
export function getTotalPages(totalItems: number, itemsPerPage: number): number {
    return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Get user-specific courses (educators see their own, learners see enrolled)
 * Specifically for DatabaseCourse since it comes from PHP MyAdmin
 */
export function getUserCourses(
    courses: DatabaseCourse[], 
    userId: number | null, 
    userType: string | undefined
): DatabaseCourse[] {
    if (!userId) return [];
    
    if (userType === 'educator') {
        return courses.filter(c => 
            c.ownerId === userId || (c.owner && c.owner.id === userId)
        );
    }
    
    // For learners, return enrolled courses (you'll need to implement this based on your data)
    return courses.filter(c => c.enrolled === true); // Add enrolled property to DatabaseCourse if needed
}

// Type guards for specific course types
export function isMarketplaceCourse(course: AnyCourse): course is MarketplaceCourse {
    return 'enrolled' in course;
}

export function isDatabaseCourse(course: AnyCourse): course is DatabaseCourse {
    return 'ownerId' in course || 'version' in course;
}