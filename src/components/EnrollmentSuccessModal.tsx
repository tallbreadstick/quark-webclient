import { motion, AnimatePresence } from "framer-motion";

type EnrollmentSuccessModalProps = {
    isOpen: boolean;
    courseName: string;
    onClose: () => void;
};

export default function EnrollmentSuccessModal({ isOpen, courseName, onClose }: EnrollmentSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Success Icon */}
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
                                >
                                    <svg
                                        className="w-8 h-8 text-green-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    Enrollment Successful!
                                </h2>
                                <p className="text-gray-300 mb-2">
                                    You've successfully enrolled in
                                </p>
                                <p className="text-blue-400 font-semibold text-lg">
                                    "{courseName}"
                                </p>
                                <p className="text-gray-400 text-sm mt-4">
                                    You can now access this course from your My Courses page.
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 cursor-pointer"
                            >
                                Okay
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}