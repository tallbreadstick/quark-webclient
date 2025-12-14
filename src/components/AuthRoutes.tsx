import { Outlet, Navigate } from 'react-router-dom';
import { loadSessionState } from '../types/UserSession';

const AuthRoutes = () => {
    const { userSession } = loadSessionState();

    // If user is already logged in, redirect to home
    return userSession ? <Navigate to="/" /> : <Outlet />;
}

export default AuthRoutes;
