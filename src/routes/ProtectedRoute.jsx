import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { token, user, loading } = useAuth();

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // Check role-based access
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/main-dashboard" replace />;
  }

  return children;
}
