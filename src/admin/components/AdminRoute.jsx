import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '../services/adminApi';

export function AdminRoute({ children }) {
  const location = useLocation();
  
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return children;
}

export default AdminRoute;
