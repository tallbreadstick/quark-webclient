import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faMousePointer } from '@fortawesome/free-solid-svg-icons';
import Page from "./page/Page";
import type { UserSession } from "../types/UserSession";
import type { Dispatch, SetStateAction } from "react";

interface LoadingStateProps {
    userSession: UserSession | null;
    setUserSession: Dispatch<SetStateAction<UserSession | null>>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ userSession, setUserSession }) => {
    return (
        <Page title={`Quark | Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                    <p className="text-slate-400">Loading course data...</p>
                </div>
            </div>
        </Page>
    );
};

interface ErrorStateProps {
    error: string;
    userSession: UserSession | null;
    setUserSession: Dispatch<SetStateAction<UserSession | null>>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, userSession, setUserSession }) => {
    const navigate = useNavigate();

    return (
        <Page title={`Quark | Chapter Editor`} userSession={userSession} setUserSession={setUserSession}>
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/courses')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        </Page>
    );
};

interface EmptySelectionStateProps {}

export const EmptySelectionState: React.FC<EmptySelectionStateProps> = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <FontAwesomeIcon icon={faMousePointer} style={{ width: 48, height: 48 }} className="mb-4 opacity-20" />
            <p>Select a chapter or item to begin editing</p>
        </div>
    );
};
