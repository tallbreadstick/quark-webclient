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
import Profile from "./pages/ProfilePage"; // Add this import
import "katex/dist/katex.min.css";

export default function App() {
    return (
        <div className="w-full h-full">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/my-courses" element={<CoursesPage />} />
                    <Route path="/my-courses/create" element={<CourseCreationPage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/course/:courseId/chapters" element={<CourseContentPage />} />
                    <Route path="/course/:courseId/edit" element={<CourseEditPage />} />
                    <Route path="/course/:courseId/fork" element={<CourseForkPage />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}