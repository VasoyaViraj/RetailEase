import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCurrentUser, getUserRoles, login as authLogin, logout as authLogout } from '@/services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setRoles(getUserRoles(currentUser));
    } catch {
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    await authLogin(email, password);
    await loadUser();
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    setRoles([]);
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
