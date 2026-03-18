import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
  allowed: ('admin' | 'dispecer' | 'sofer' | 'client')[];
  children: React.ReactNode;
}

/** Redirects to the role's home page if user doesn't have access */
export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { role } = useAuth();

  if (!allowed.includes(role)) {
    const home = role === 'sofer' ? '/sofer' : role === 'client' ? '/comenzi' : '/';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}

/** Role home pages for redirect after role switch */
export function getRoleHome(role: string): string {
  if (role === 'sofer') return '/sofer';
  if (role === 'client') return '/comenzi';
  return '/';
}
