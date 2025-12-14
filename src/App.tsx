import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import CourseCreationPage from "./pages/CourseCreationPage";
import MarketplacePage from "./pages/MarketplacePage";
import CourseContentPage from "./pages/CourseContentPage";
import CourseEditPage from "./pages/CourseEditPage";
import CourseForkPage from "./pages/CourseForkPage";
import Profile from "./pages/ProfilePage"; 
import "katex/dist/katex.min.css";
import ChapterEditPage from "./pages/ChapterEditPage";
import LessonEditPage from "./pages/LessonEditPage";
import ActivityEditPage from "./pages/ActivityEditPage";

import ProtectedRoutes from "./components/ProtectedRoutes";
import AuthRoutes from "./components/AuthRoutes";

export default function App() {
    return (
        <div className="w-full h-full">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    {/**
                     * AUTH ROUTES - Only accessible when NOT logged in
                     */}
                    <Route element={<AuthRoutes />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Route>
                    <Route path="/my-courses" element={<CoursesPage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/my-courses/create" element={<CourseCreationPage />} />
                    
                    {/**
                     * PROTECTED ROUTES
                     */}
                    <Route element={<ProtectedRoutes />}>                      
                        <Route path="/course/:courseId/chapters" element={<CourseContentPage />} />
                        <Route path="/course/:courseId/chapters/edit" element={<ChapterEditPage />} />
                        <Route path="/course/:courseId/edit" element={<CourseEditPage />} />
                        <Route path="/course/:courseId/fork" element={<CourseForkPage />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/lesson/:lessonId/edit" element={<LessonEditPage />} />
                        <Route path="/activity/:activityId/edit" element={<ActivityEditPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}