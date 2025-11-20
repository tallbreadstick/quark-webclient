// Base course properties that both types share
export type BaseCourse = {
    id: number;
    name: string;
    description?: string | null;
    tags: string[];
};

// Marketplace Course (from mock data)
export type MarketplaceCourse = BaseCourse & {
    description: string; // Make description required for marketplace courses
    owner: {
        username: string;
    };
    enrolled: boolean;
};

// Database Course (from PHP MyAdmin)
export type DatabaseCourse = BaseCourse & {
    ownerId?: number | null;
    owner?: { id?: number; username?: string } | null;
    version?: number;
    [key: string]: any;
};

// Union type for utilities that work with both
export type AnyCourse = MarketplaceCourse | DatabaseCourse;