// Item type representing a lesson or activity within a chapter
export type Item = {
    id: number;
    itemType: "ACTIVITY" | "LESSON";
    idx: number;
    name: string;
    description: string;
    icon: string;
    finishMessage?: string;
    ruleset?: string;
    uiSerialId?: string; // UI-managed serial id (e.g. L1, A1) used to track selection
};

// Chapter type containing multiple items
export type Chapter = {
    id: number;
    idx: number;
    name: string;
    description: string;
    icon: string;
    items: Item[]
};

// Selection type for tracking which chapter or item is currently selected
export type Selection = 
    | { type: 'chapter'; id: number } 
    | { type: 'item'; chapterId: number; serialId: string } 
    | null;

// Helper type for selection data after resolution
export type SelectionData = 
    | { type: 'chapter'; data: Chapter }
    | { type: 'item'; data: Item; chapter: Chapter }
    | null;
