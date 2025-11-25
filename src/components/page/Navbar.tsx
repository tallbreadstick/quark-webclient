import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { UserSession } from "../../types/UserSession";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/logos/quarklogo-gradient.png";

export interface NavbarProps {
    userSession: UserSession | null;
    setUserSession: Dispatch<SetStateAction<UserSession | null>>;
}

const Navbar: FunctionComponent<NavbarProps> = ({ userSession, setUserSession }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear session (hook will also remove from localStorage)
        setUserSession(null);
        // Navigate to home (client-side)
        navigate("/");
    };

    const handleProfileClick = () => {
        // Navigate to profile page
        navigate("/profile");
    };

    return (
        <nav className="w-full flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-md text-white shadow-lg">
            {/* --- Left side: quick links --- */}
            <div className="flex items-center gap-8 font-medium text-lg">
                <img src={Logo} alt="Quark Logo" className="w-10 h-10"/>
                <a href="/" className="hover:text-[#bccdff] transition-colors">Home</a>
                <a href="/marketplace" className="hover:text-[#bccdff] transition-colors">Marketplace</a>
                <a href="/my-courses" className="hover:text-[#bccdff] transition-colors">My Courses</a>
            </div>

            {/* --- Right side: session dependent --- */}
            <div className="flex items-center gap-4">
                {userSession ? (
                    <div className="flex items-center gap-4">
                        {/* User profile with hover effect */}
                        <div 
                            onClick={handleProfileClick}
                            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
                        >
                            {/* Placeholder profile image */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-cyan-400 group-hover:border-cyan-300 transition-colors">
                                <span className="text-white font-semibold text-sm">
                                    {userSession.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <span className="font-semibold group-hover:text-[#bccdff] transition-colors">
                                {userSession.username}
                            </span>
                        </div>
                        
                        {/* Logout button - improved color */}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold cursor-pointer"
                            aria-label="Log out"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <a
                            href="/login"
                            className="px-4 py-2 border border-[#566fb8] rounded-lg hover:bg-blue-500 hover:text-white transition font-semibold cursor-pointer"
                        >
                            Login
                        </a>
                        <a
                            href="/register"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold cursor-pointer"
                        >
                            Register
                        </a>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;