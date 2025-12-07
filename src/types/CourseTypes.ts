// types/CourseTypes.ts
export interface MarketplaceCourse {
    id: number;
    name: string;
    description: string;
    owner: { username: string };
    tags: string[];
    enrolled: boolean;
    forkable?: boolean;
}

export interface DatabaseCourse {
    id: number;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    forkable?: boolean;
    owner?: { username: string };
    tags?: string[];
    chapters?: any[];
    lessons?: any[];
    pages?: any[];
}