export const educatorTabs = [
    { id: "achievements", label: "Achievements", emoji: "🏆" },
    { id: "analytics", label: "Analytics", emoji: "📈" },
    { id: "activity", label: "Activity", emoji: "📊" }
];

export const learnerTabs = [
    { id: "achievements", label: "Achievements", emoji: "🏆" },
    { id: "certificates", label: "Certificates", emoji: "📜" },
    { id: "activity", label: "Activity", emoji: "📊" }
];

export const mockAchievements = {
    educator: [
        { id: 1, icon: "👨‍🏫", title: "Teaching Badge 1", description: "25 students reached" },
        { id: 2, icon: "👨‍🏫", title: "Teaching Badge 2", description: "50 students reached" },
        { id: 3, icon: "👨‍🏫", title: "Teaching Badge 3", description: "75 students reached" },
        { id: 4, icon: "👨‍🏫", title: "Teaching Badge 4", description: "100 students reached" }
    ],
    learner: [
        { id: 1, icon: "⭐", title: "Badge 1", description: "Achievement description" },
        { id: 2, icon: "⭐", title: "Badge 2", description: "Achievement description" },
        { id: 3, icon: "⭐", title: "Badge 3", description: "Achievement description" },
        { id: 4, icon: "⭐", title: "Badge 4", description: "Achievement description" }
    ]
};

export const mockAnalytics = [
    { title: "Student Engagement", value: "85%", color: "blue-400", description: "Average completion rate" },
    { title: "Total Students", value: "247", color: "green-400", description: "Across all courses" },
    { title: "Course Rating", value: "4.8★", color: "yellow-400", description: "Based on 89 reviews" },
    { title: "Content Published", value: "12", color: "purple-400", description: "Courses created" }
];

export const mockActivities = {
    educator: [
        { id: 1, title: "Published new course module 1", time: "2 hours ago" },
        { id: 2, title: "Published new course module 2", time: "2 hours ago" },
        { id: 3, title: "Published new course module 3", time: "2 hours ago" }
    ],
    learner: [
        { id: 1, title: "Completed lesson 1 in Data Structures", time: "2 hours ago" },
        { id: 2, title: "Completed lesson 2 in Data Structures", time: "2 hours ago" },
        { id: 3, title: "Completed lesson 3 in Data Structures", time: "2 hours ago" }
    ]
};