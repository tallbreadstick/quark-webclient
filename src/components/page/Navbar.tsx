import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { UserSession } from "../../types/UserSession";

export interface NavbarProps {
    userSession: UserSession | null;
    setUserSession: Dispatch<SetStateAction<UserSession | null>>;
}

const Navbar: FunctionComponent<NavbarProps> = ({ userSession, setUserSession }) => {
    return (
        <nav className="w-full flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-md text-white shadow-lg">
            {/* --- Left side: quick links --- */}
            <div className="flex items-center gap-8 font-medium text-lg">
                <a href="/" className="hover:text-[#bccdff] transition-colors">Home</a>
                <a href="/marketplace" className="hover:text-[#bccdff] transition-colors">Marketplace</a>
                <a href="/courses" className="hover:text-[#bccdff] transition-colors">My Courses</a>
            </div>

            {/* --- Right side: session dependent --- */}
            <div className="flex items-center gap-4">
                {userSession ? (
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition">
                        <img
                            src={userSession.profilePictureUrl || "/default-pfp.png"}
                            alt="Profile"
                            className="w-9 h-9 rounded-full object-cover border border-cyan-400"
                        />
                        <span className="font-semibold">{userSession.username}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <a
                            href="/login"
                            className="px-4 py-2 border border-[#566fb8] rounded-lg hover:bg-[#bccdff] hover:text-white transition font-semibold"
                        >
                            Login
                        </a>
                        <a
                            href="/register"
                            className="px-4 py-2 bg-[#566fb8] text-white rounded-lg hover:bg-[#bccdff] transition font-semibold"
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
