import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface GuestRouteProps {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}
