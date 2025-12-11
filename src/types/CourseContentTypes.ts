// Course Content Types
export type PageContent = {
    id: number;
    number?: number;
    content?: string | null;
    renderer?: string | null;
};

export type Question = {
    question: string;
    points: number;
    correct: string;
    choices: string[];
};

export type MCQSection = {
    instructions: string;
    questions: Question[];
};

export type TestCase = {
    expected: string;
    driver: string;
    points: number;
    hidden: boolean;
};

export type CodeSection = {
    renderer: "MARKDOWN" | "LATEX";
    instructions: string;
    defaultCode?: string;
    sources?: string[];
    testCases: TestCase[];
};

export type ItemSection = {
    id: number;
    idx?: number;
    sectionType: "MCQ" | "CODE";
    mcq?: MCQSection;
    code?: CodeSection;
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
    sections?: ItemSection[];
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
