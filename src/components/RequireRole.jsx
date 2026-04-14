import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Route guard for staff routes.
 * Usage: <RequireRole roles={['cashier','owner']}><Page /></RequireRole>
 */
export default function RequireRole({ roles, children }) {
  const { user, loading, hasRole } = useAuth();

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

  if (!hasRole(...roles)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
