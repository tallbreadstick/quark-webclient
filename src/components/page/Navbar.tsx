import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { UserSession } from "../../types/UserSession";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import usePortal from "../../utils/usePortal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Logo from "../../assets/logos/quarklogo-gradient.png";

export interface NavbarProps {
    userSession: UserSession | null;
    setUserSession: Dispatch<SetStateAction<UserSession | null>>;
}

const Navbar: FunctionComponent<NavbarProps> = ({ userSession, setUserSession }) => {
    const navigate = useNavigate();
    const portalEl = usePortal('nav-profile-dropdown');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // toggle from clicks inside page (ProfilePage avatar/username)
    useEffect(() => {
        const onToggle = () => setDropdownOpen((s) => !s);
        const onOpen = () => setDropdownOpen(true);

        window.addEventListener('profile-menu-toggle', onToggle as EventListener);
        window.addEventListener('profile-menu-open', onOpen as EventListener);

        return () => {
            window.removeEventListener('profile-menu-toggle', onToggle as EventListener);
            window.removeEventListener('profile-menu-open', onOpen as EventListener);
        };
    }, []);

    // close on outside click / Escape
    useEffect(() => {
        if (!dropdownOpen) return;

        const onDoc = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDropdownOpen(false);
        };

        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [dropdownOpen]);

    return (
        <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-md text-white shadow-lg z-50">
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
                        <div
                            onClick={() => setDropdownOpen((s) => !s)}
                            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
                        >
                            {userSession.profilePictureUrl ? (
                                <img
                                    src={userSession.profilePictureUrl}
                                    alt={userSession.username || 'Profile'}
                                    className="w-10 h-10 rounded-full object-cover border border-cyan-400 group-hover:border-cyan-300 transition-colors"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-cyan-400 group-hover:border-cyan-300 transition-colors">
                                    <span className="text-white font-semibold text-sm">
                                        {userSession.username?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}

                            <span className="font-semibold group-hover:text-[#bccdff] transition-colors">
                                {userSession.username}
                            </span>
                        </div>
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

            {dropdownOpen && portalEl && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-50"
                    style={{ top: 56, right: 16 }}
                    role="menu"
                    aria-label="Profile menu"
                >
                    <div className="bg-[#0f1724] border border-white/10 rounded-lg p-2 w-48 shadow-xl">
                        <button
                            onClick={() => {
                                setDropdownOpen(false);
                                navigate('/profile');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded"
                        >
                            <FontAwesomeIcon icon={faUser} />
                            <span>View Profile</span>
                        </button>

                        <button
                            onClick={() => {
                                setDropdownOpen(false);
                                setUserSession(null);
                                navigate('/');
                            }}
                            className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded"
                        >
                            <FontAwesomeIcon icon={faArrowRightFromBracket} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>,
                portalEl
            )}
        </nav>
    );
};

export default Navbar;
