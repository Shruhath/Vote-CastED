import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseSignIn } from './FirebaseSignIn';

interface ProtectedRouteProps {
  children: ReactNode;
  logoUrl?: string;
}

export function ProtectedRoute({ children, logoUrl }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <FirebaseSignIn logoUrl={logoUrl} />;
  }

  return <>{children}</>;
}
