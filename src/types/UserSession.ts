import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

export interface UserSession {
    userType: 'Educator' | 'Learner';
    username: string;
    profilePictureUrl: string;
}

// Custom hook that synchronizes session state with localStorage.
// Calling `setUserSession` will persist the session so other pages/components
// that call `loadSessionState()` will read the same value.
export function loadSessionState() {
    const [userSession, setUserSessionState] = useState<UserSession | null>(() => {
        try {
            const raw = localStorage.getItem("session");
            if (raw) return JSON.parse(raw) as UserSession;
        } catch (e) {
            console.error("Failed to parse stored session:", e);
        }
        return null;
    });

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "session") {
                try {
                    setUserSessionState(e.newValue ? (JSON.parse(e.newValue) as UserSession) : null);
                } catch (err) {
                    console.error("Failed to sync session from storage event:", err);
                    setUserSessionState(null);
                }
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Provide a setter that matches React's Dispatch<SetStateAction<...>>
    // so callers can pass either a value or an updater function.
    const setUserSession: Dispatch<SetStateAction<UserSession | null>> = (value) => {
        if (typeof value === "function") {
            setUserSessionState((prev) => {
                const next = (value as (prev: UserSession | null) => UserSession | null)(prev);
                try {
                    if (next === null) localStorage.removeItem("session");
                    else localStorage.setItem("session", JSON.stringify(next));
                } catch (e) {
                    console.error("Failed to save session:", e);
                }
                return next;
            });
        } else {
            try {
                if (value === null) localStorage.removeItem("session");
                else localStorage.setItem("session", JSON.stringify(value));
            } catch (e) {
                console.error("Failed to save session:", e);
            }
            setUserSessionState(value);
        }
    };

    return { userSession, setUserSession };
}
