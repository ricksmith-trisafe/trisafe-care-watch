import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isInitialized, isLoading } = useAppSelector((state) => state.auth);

  // Only show loading on initial auth check, not when already authenticated
  // This prevents Dashboard unmounting during background auth operations
  if (!isInitialized || (isLoading && !isAuthenticated)) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
