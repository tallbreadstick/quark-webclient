import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";

export default function App() {

    return (
        <div className="w-full h-full">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
