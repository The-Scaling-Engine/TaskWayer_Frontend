import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface UserRouteProps {
  children: React.ReactNode;
}

export default function UserRoute({ children }: UserRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return <>{children}</>;
}
