import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type UserRole = 'admin' | 'finance' | 'client' | null;

type AuthContextValue = {
  role: UserRole;
  login: (role: Exclude<UserRole, null>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_role');
    if (stored) setRole(stored as UserRole);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    role,
    login: (nextRole) => {
      setRole(nextRole);
      localStorage.setItem('auth_role', nextRole);
    },
    logout: () => {
      setRole(null);
      localStorage.removeItem('auth_role');
    }
  }), [role]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


