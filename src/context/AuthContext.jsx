import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for token in sessionStorage first, then localStorage
        let storedToken = sessionStorage.getItem("token");
        
        if (!storedToken) {
          storedToken = localStorage.getItem("token");
        }

        if (storedToken) {
          console.log('Auth init: token found');
          const decoded = jwtDecode(storedToken);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            console.log('Auth init: token expired');
            sessionStorage.removeItem("token");
            localStorage.removeItem("token");
          } else {
            console.log('Auth init: token valid, role:', decoded.role);
            setToken(storedToken);
            setUser(decoded);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (loginResponse, rememberMe = false) => {
    try {
      let token = loginResponse.data?.token || loginResponse.data?.access_token;
      if (!token) {
        throw new Error('No token received from server');
      }

      console.log('Login: token received');
      const decoded = jwtDecode(token);
      console.log('Login: decoded user', decoded, 'role:', decoded.role);

      // Store token based on rememberMe
      if (rememberMe) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
      }

      // Update state
      setToken(token);
      setUser(decoded);
      setError(null);

      console.log('Login: state updated, role:', decoded.role);
      
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid token received from server");
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(async (shouldNavigate = true) => {
    console.log('Logout called');
    if (user?.id) {
      try {
        await api.post('/auth/logout', { userId: user.id });
      } catch (err) {
        console.error("Failed to log logout:", err);
      }
    }
    
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    
    setToken(null);
    setUser(null);
    setError(null);
    
    if (shouldNavigate && location.pathname !== "/signin") {
      navigate("/signin", { replace: true });
    }
  }, [navigate, location.pathname, user]);

  // Role-based redirect — FIXED
  const getRedirectPath = useCallback((userData) => {
    const role = userData?.role;
    console.log('getRedirectPath role:', role);
    
    switch (role) {
      case 'Admin':
        return '/user-management'; // Admin dashboard
      case 'Officer':
        return '/weekly-report'; // Officer dashboard
      case 'User':
        return '/main-dashboard'; // User dashboard
      default:
        return '/welcome';
    }
  }, []);

  // Check role
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (!roles) return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  const value = {
    token,
    user,
    loading,
    error,
    login,
    logout,
    getRedirectPath,
    hasRole,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
