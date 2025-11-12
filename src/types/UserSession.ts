import { useState, useEffect } from "react";

export interface UserSession {
    userType: 'Educator' | 'Learner';
    username: string;
    profilePictureUrl: string;
}

export function loadSessionState() {
    const [userSession, setUserSession] = useState<UserSession | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("session");
            if (raw) {
                const storedSession = JSON.parse(raw) as UserSession;
                setUserSession(storedSession);
            }
        } catch (e) {
            console.error("Failed to load session:", e);
            setUserSession(null);
        }
    }, []);

    return { userSession, setUserSession };
}
