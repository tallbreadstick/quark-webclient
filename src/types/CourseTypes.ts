// types/CourseTypes.ts
export interface BaseCourse {
    id: number;
    name: string;
    description?: string | null;
    ownerId?: number | null;
    owner?: { id?: number; username?: string } | null;
    tags?: string[]; // ✅ Make optional
    forkable?: boolean;
    [key: string]: any;
}

export interface MarketplaceCourse extends BaseCourse {
    enrolled: boolean;
    // tags remains optional here too
}

export interface DatabaseCourse extends BaseCourse {
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    chapters?: any[];
    lessons?: any[];
    pages?: any[];
}