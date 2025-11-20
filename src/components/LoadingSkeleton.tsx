type LoadingSkeletonProps = {
    count?: number;
    variant?: 'grid' | 'list';
    showEditButton?: boolean;
};

export default function LoadingSkeleton({ 
    count = 6, 
    variant = 'grid',
    showEditButton = false 
}: LoadingSkeletonProps) {
    if (variant === 'list') {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, index) => (
                    <div 
                        key={index}
                        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <div className="h-6 bg-white/10 rounded mb-2 w-1/3"></div>
                                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-white/10 rounded w-16"></div>
                                {showEditButton && (
                                    <div className="h-8 bg-white/10 rounded w-12"></div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: count }).map((_, index) => (
                <div 
                    key={index}
                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse"
                >
                    <div className="mb-4">
                        <div className="h-6 bg-white/10 rounded mb-2"></div>
                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-4 bg-white/10 rounded w-1/3"></div>
                        <div className="flex gap-2">
                            <div className="h-8 bg-white/10 rounded w-16"></div>
                            {showEditButton && (
                                <div className="h-8 bg-white/10 rounded w-12"></div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}