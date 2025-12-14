import {Outlet, Navigate} from 'react-router-dom';
import {loadSessionState} from '../types/UserSession';

const ProtectedRoutes = () => {
    const user = null
    const {userSession} = loadSessionState();

    return userSession ? <Outlet /> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;