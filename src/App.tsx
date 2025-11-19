import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import CourseCreationPage from "./pages/CourseCreationPage";
import ChapterPage from "./pages/CourseContent";

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
                    <Route path="/course/:courseId/chapters" element={<ChapterPage />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
