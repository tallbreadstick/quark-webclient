// types/course.types.ts
export interface MarketplaceCourse {
    id: number;
    name: string;
    description: string;
    owner: { username: string };
    tags: string[];
    enrolled: boolean;
    forkable?: boolean;
}