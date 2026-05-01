import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getCurrentUser,
  getUserRoles,
  login as authLogin,
  logout as authLogout
} from '@/services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      const userRoles = getUserRoles(currentUser);

      setUser(currentUser);
      setRoles(userRoles);

      // ✅ Store in localStorage
      localStorage.setItem("user", JSON.stringify(currentUser));
      localStorage.setItem("roles", JSON.stringify(userRoles));

      // ✅ Store label
      if (userRoles.includes("cashier")) {
        localStorage.setItem("label", "cashier");
      } else if (userRoles.includes("admin")) {
        localStorage.setItem("label", "admin");
      } else {
        localStorage.setItem("label", "user");
      }

    } catch (error) {
      setUser(null);
      setRoles([]);

      localStorage.removeItem("user");
      localStorage.removeItem("roles");
      localStorage.removeItem("label");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ✅ Login
  const login = async (email, password) => {
    try {
      await authLogout(); // clear old session
    } catch {}

    await authLogin(email, password);
    await loadUser();
  };

  // ✅ Logout
  const logout = async () => {
    await authLogout();
    setUser(null);
    setRoles([]);

    localStorage.removeItem("user");
    localStorage.removeItem("roles");
    localStorage.removeItem("label");
  };

  // ✅ Role checker
  const hasRole = (...requiredRoles) => {
    return requiredRoles.some((role) => roles.includes(role));
  };

  return (
    <AuthContext.Provider
      value={{ user, roles, loading, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}