import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;