// Course Content Types
export type PageContent = {
    id: number;
    number?: number;
    content?: string | null;
};

export type Item = {
    id: number;
    name: string;
    number?: number;
    description?: string | null;
    icon?: string | null;
    finishMessage?: string | null;
    pages?: PageContent[];
    type: "LESSON" | "ACTIVITY";
    ruleset?: string | null;
};

export type Chapter = {
    id: number;
    name: string;
    number?: number;
    description?: string | null;
    icon?: string | null;
    items?: Item[];
};

export type Course = {
    id: number;
    name: string;
    description?: string | null;
    introduction?: string | null;
};

export type CourseProgress = {
    progress: number; // 0.0 to 1.0
    lastAccessedChapterId?: number;
    lastAccessedItemId?: number;
};

export type NavigationState = {
    selectedChapterIndex: number;
    selectedItemIndex: number;
};
