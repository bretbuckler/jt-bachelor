import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, gateUnlocked } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-pine flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-pine-light border-t-gold rounded-full animate-spin mx-auto"
               style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-cream/60 mt-4 font-serif text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!gateUnlocked) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
