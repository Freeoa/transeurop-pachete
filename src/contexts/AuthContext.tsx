import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data';

interface AuthContextType {
  user: User;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  isManager: boolean;
  isDriver: boolean;
  isClient: boolean;
  /** For demo: driver ID mapped to the sofer role user */
  driverId: string | null;
  /** For demo: client ID mapped to the client role user */
  clientId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Mock client user (not in the users table) */
const CLIENT_USER: User = { id: 'usr-client', name: 'Maria Ionescu', email: 'maria.ionescu@gmail.com', role: 'client' };

/** Map roles to mock entity IDs for demo filtering */
const ROLE_DRIVER_ID = 'drv-1'; // Ionuț Dobre
const ROLE_CLIENT_ID = 'cli-1'; // Maria Ionescu

function getUserForRole(role: UserRole): User {
  if (role === 'client') return CLIENT_USER;
  return mockUsers.find((u) => u.role === role) ?? mockUsers[0];
}

function getInitialRole(): UserRole {
  if (typeof window === 'undefined') return 'admin';
  const saved = localStorage.getItem('transeurop-role');
  if (saved && ['admin', 'dispecer', 'sofer', 'client'].includes(saved)) {
    return saved as UserRole;
  }
  return 'admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(getInitialRole);
  const [user, setUser] = useState<User>(() => getUserForRole(getInitialRole()));

  const switchRole = useCallback((newRole: UserRole) => {
    setRole(newRole);
    setUser(getUserForRole(newRole));
    localStorage.setItem('transeurop-role', newRole);
  }, []);

  const isManager = role === 'admin' || role === 'dispecer';
  const isDriver = role === 'sofer';
  const isClient = role === 'client';
  const driverId = isDriver ? ROLE_DRIVER_ID : null;
  const clientId = isClient ? ROLE_CLIENT_ID : null;

  return (
    <AuthContext.Provider value={{ user, role, switchRole, isManager, isDriver, isClient, driverId, clientId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
