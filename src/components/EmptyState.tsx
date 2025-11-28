import { Link } from "react-router-dom";

type EmptyStateProps = {
    message: string;
    actionText?: string;
    actionLink?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
};

export default function EmptyState({ 
    message, 
    actionText, 
    actionLink,
    icon = "📚",
    children 
}: EmptyStateProps) {
    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center text-gray-400">
            {icon && <span className="text-6xl text-gray-600 mb-4 block">{icon}</span>}
            <p className="mb-4">{message}</p>
            {actionText && actionLink && (
                <Link 
                    to={actionLink} 
                    className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
                >
                    {actionText}
                </Link>
            )}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}