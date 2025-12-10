type SearchFilterBarProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    sortBy?: string;
    onSortChange?: (value: string) => void;
    selectedTag?: string;
    allTags?: string[];
    onTagSelect?: (tag: string) => void;
    showCreateButton?: boolean;
    createButtonLink?: string;
    createButtonText?: string;
    searchPlaceholder?: string;
};

export default function SearchFilterBar({
    searchTerm,
    onSearchChange,
    sortBy,
    onSortChange,
    selectedTag,
    allTags,
    onTagSelect,
    showCreateButton = false,
    createButtonLink = "#",
    createButtonText = "Create",
    searchPlaceholder = "Search..."
}: SearchFilterBarProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
                <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition"
                />
            </div>

            {/* Sort Filter */}
            {sortBy !== undefined && onSortChange && (
                <div className="lg:w-48 relative">
                    <select 
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600"
                    >
                        <option value="newest">Sort by: Newest</option>
                        <option value="popular">Sort by: Popular</option>
                        <option value="name">Sort by: Name</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                            className="h-4 w-4 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Tag Filter (if provided) */}
            {allTags && allTags.length > 0 && onTagSelect && (
                <div className="lg:w-64 relative">
                    <select
                        value={selectedTag}
                        onChange={(e) => onTagSelect(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition [&>option]:bg-slate-900 [&>option]:text-white [&>option:checked]:bg-blue-600 cursor-pointer"
                    >
                        <option value="">All Tags</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Create Button */}
            {showCreateButton && (
                <div className="w-full lg:w-48">
                    <a 
                        href={createButtonLink} 
                        className="w-full px-4 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition flex items-center justify-center whitespace-nowrap"
                    >
                        {createButtonText}
                    </a>
                </div>
            )}
        </div>
    );
}