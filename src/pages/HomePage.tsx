import { motion } from "framer-motion";
import Page from "../components/page/Page";
import CourseList from "../components/CourseList";
import { loadSessionState } from "../types/UserSession";
import { Link } from "react-router-dom";

export default function HomePage() {
    const { userSession, setUserSession } = loadSessionState();
    const isLoggedIn = userSession !== null; // adjust to your session structure

    return (
        <Page title="Quark | Home" userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-12 py-16 text-gray-200">
                {!isLoggedIn ? (
                    // --- Logged out state ---
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl text-center"
                    >
                        <h1 className="text-5xl font-bold mb-6 text-white">
                            Discover Knowledge at the Fundamental Level
                        </h1>
                        <p className="text-lg mb-10 text-gray-400 leading-relaxed">
                            Quark is an interactive learning platform designed for the curious — 
                            bridging the gap between programming and the physical sciences. 
                            Explore simulations, challenges, and projects that spark understanding 
                            from the atomic to the cosmic.
                        </p>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            <Link
                                to="/marketplace"
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white shadow-lg transition-all duration-300"
                            >
                                Browse the Marketplace
                            </Link>
                        </motion.div>

                        <div className="mt-20 text-sm text-gray-500 italic">
                            “The pursuit of understanding is the noblest form of curiosity.”
                        </div>
                    </motion.div>
                ) : (
                    // --- Logged in state ---
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-6xl"
                    >
                        <h1 className="text-4xl font-semibold text-white mb-4">
                            Welcome back, {userSession.username || "Explorer"}.
                        </h1>
                        <p className="text-gray-400 mb-12">
                            Continue your journey through knowledge — explore your active courses, 
                            track your progress, and dive back into discovery.
                        </p>

                        {/* Dashboard layout: recent activity (left, wide), learning tracks (right), then courses */}
                        <section className="grid grid-cols-3 gap-6 mb-16">
                            {/* Recent Activity - spans two columns */}
                            <div className="col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">Pick Up Where You Left Off</p>
                            </div>

                            {/* Learning Tracks (right column) */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-40 flex flex-col justify-center items-center">
                                <span className="text-gray-400">[UNDER CONSTRUCTION]</span>
                                <p className="mt-2 text-sm text-gray-500">Learning Tracks</p>
                            </div>
                        </section>

                        {/* Your Courses section below the dashboard */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Your Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CourseList userId={userSession.id} maxItems={6} className="w-full" scrollable={true} maxHeightClass="max-h-96" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </Page>
    );
}
