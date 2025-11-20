import type { MarketplaceCourse } from "../types/CourseTypes";

export const mockCourses: MarketplaceCourse[] = [
    {
        id: 1,
        name: "Data Structures and Algorithms",
        description: "Master fundamental data structures and algorithmic thinking",
        owner: { username: "tallbreadstick" },
        tags: ["Computer Science", "Programming"],
        enrolled: false
    },
    {
        id: 2,
        name: "Quantum Mechanics Fundamentals",
        description: "Explore the quantum world through interactive simulations",
        owner: { username: "Dr. Physics" },
        tags: ["Physics", "Quantum"],
        enrolled: false
    },
    {
        id: 3,
        name: "Machine Learning Basics",
        description: "Introduction to machine learning concepts and applications",
        owner: { username: "AI Educator" },
        tags: ["AI", "Programming"],
        enrolled: false
    },
    {
        id: 4,
        name: "Calculus and Analysis",
        description: "Deep dive into calculus with visual proofs and examples",
        owner: { username: "Math Wizard" },
        tags: ["Mathematics", "Calculus"],
        enrolled: false
    },
    {
        id: 5,
        name: "Object-Oriented Programming",
        description: "at kern gumonan's favorite class",
        owner: { username: "tallbreadstick" },
        tags: ["Programming", "OOP"],
        enrolled: false
    },
    {
        id: 6,
        name: "Data Analytics",
        description: "marriage between quantitative methods and programming",
        owner: { username: "tallbreadstick" },
        tags: ["Data Science", "Statistics"],
        enrolled: false
    },
    {
        id: 7,
        name: "Differential Equations",
        description: "calculus topics",
        owner: { username: "tallbreadstick" },
        tags: ["Mathematics", "Calculus"],
        enrolled: false
    },
    {
        id: 8,
        name: "Web Development",
        description: "Build modern web applications",
        owner: { username: "Web Master" },
        tags: ["Programming", "Web"],
        enrolled: false
    },
    {
        id: 9,
        name: "Database Systems",
        description: "Learn SQL and database design",
        owner: { username: "DB Expert" },
        tags: ["Computer Science", "Database"],
        enrolled: false
    },
    {
        id: 10,
        name: "Mobile App Development",
        description: "Create iOS and Android apps",
        owner: { username: "Mobile Dev" },
        tags: ["Programming", "Mobile"],
        enrolled: false
    },
    {
        id: 11,
        name: "Artificial Intelligence",
        description: "Advanced AI concepts and implementations",
        owner: { username: "AI Researcher" },
        tags: ["AI", "Computer Science"],
        enrolled: false
    },
    {
        id: 12,
        name: "Cyber Security",
        description: "Protect systems from cyber threats",
        owner: { username: "Security Expert" },
        tags: ["Security", "Computer Science"],
        enrolled: false
    }
];

// Re-export the type for convenience
export type { MarketplaceCourse };