type Tab = {
    id: string;
    label: string;
    emoji: string;
};

type ProfileTabProps = {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
};

export default function ProfileTab({ tabs, activeTab, onTabChange }: ProfileTabProps) {
    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-1 cursor-default">
            <div className={`grid gap-1 grid-cols-${tabs.length}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                            activeTab === tab.id
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <span className="text-lg">{tab.emoji}</span>
                        <span className="font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}