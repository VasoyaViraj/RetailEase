import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Route guard for customer-facing routes.
 * Requires any authenticated user (no role check).
 */
export default function RequireCustomerAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-medium">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
