// components/modals/AlertModal.tsx
import { motion, AnimatePresence } from "framer-motion";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  buttonText?: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
  showIcon?: boolean;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Okay",
  variant = "success",
  showIcon = true
}: AlertModalProps) {
  if (!isOpen) return null;

  const variantConfig = {
    success: {
      iconColor: "text-green-400",
      bgColor: "bg-green-500/20",
      buttonClass: "bg-blue-600 text-white hover:bg-blue-700" // Changed to blue
    },
    info: {
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/20",
      buttonClass: "bg-blue-600 text-white hover:bg-blue-700" // Changed to blue
    },
    warning: {
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/20",
      buttonClass: "bg-blue-600 text-white hover:bg-blue-700" // Changed to blue
    },
    error: {
      iconColor: "text-red-400",
      bgColor: "bg-red-500/20",
      buttonClass: "bg-blue-600 text-white hover:bg-blue-700" // Changed to blue
    }
  };

  const { iconColor, bgColor, buttonClass } = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {showIcon && (
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center`}
                  >
                    <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {variant === "success" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                      {variant === "info" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      {variant === "warning" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                      {variant === "error" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
                    </svg>
                  </motion.div>
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
                <div className="text-gray-300">{message}</div>
              </div>

              <button
                onClick={onClose}
                className={`w-full px-6 py-3 ${buttonClass} font-semibold rounded-lg transition-colors duration-200 cursor-pointer`}
              >
                {buttonText}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}