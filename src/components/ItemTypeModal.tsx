import React from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faFlask } from '@fortawesome/free-solid-svg-icons';

interface ItemTypeModalProps {
    isOpen: boolean;
    onLessonCreate: () => void;
    onActivityCreate: () => void;
    onCancel: () => void;
}

export const ItemTypeModal: React.FC<ItemTypeModalProps> = ({
    isOpen,
    onLessonCreate,
    onActivityCreate,
    onCancel,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
            <div 
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-white mb-2">Choose Item Type</h3>
                <p className="text-slate-400 mb-6">Select the type of content you want to add to this chapter.</p>

                <div className="space-y-3">
                    {/* Lesson Button */}
                    <button
                        onClick={onLessonCreate}
                        className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <FontAwesomeIcon icon={faFileLines} className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-white mb-1">Lesson</div>
                                <div className="text-sm text-slate-400">Traditional learning content with pages</div>
                            </div>
                        </div>
                    </button>

                    {/* Activity Button */}
                    <button
                        onClick={onActivityCreate}
                        className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-xl transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <FontAwesomeIcon icon={faFlask} className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-white mb-1">Activity</div>
                                <div className="text-sm text-slate-400">Interactive exercises with sections</div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Cancel Button */}
                <button
                    onClick={onCancel}
                    className="w-full mt-4 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </div>,
        document.body
    );
};