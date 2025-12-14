import {Outlet, Navigate} from 'react-router-dom';
import {loadSessionState} from '../types/UserSession';

const ProtectedRoutes = () => {
    const user = null
    const {userSession} = loadSessionState();

        // Not logged in - redirect to login
        if (!userSession) {
            return <Navigate to="/login" />;
        }

    return userSession ? <Outlet /> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;