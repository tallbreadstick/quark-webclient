// components/modals/ActionModal.tsx
import { motion, AnimatePresence } from "framer-motion";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false
}: ActionModalProps) {
  if (!isOpen) return null;

  // All confirm buttons use blue, cancel uses border with red hover
  const confirmButtonClass = "bg-blue-600 text-white hover:bg-blue-700";

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
              className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
                <p className="text-gray-300">{message}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-[#566fb8] rounded-lg text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors duration-200 font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 font-semibold ${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                >
                  {isLoading ? "Processing..." : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}