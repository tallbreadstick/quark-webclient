import { Outlet, Navigate } from 'react-router-dom';
import { loadSessionState } from '../types/UserSession';
import { useUserProfile } from '../utils/useUserProfile';

const EducatorOnlyRoutes = () => {
    const { userSession } = loadSessionState();
    const { profile: userProfile, loading } = useUserProfile(userSession);

    // Not logged in - redirect to login
    if (!userSession) {
        return <Navigate to="/login" />;
    }

    // Still loading profile - wait
    if (loading) {
        return null;
    }

    // Not an educator - redirect to home
    if (userProfile?.userType !== 'educator') {
        return <Navigate to="/" />;
    }

    // Educator - allow access
    return <Outlet />;
}

export default EducatorOnlyRoutes;
