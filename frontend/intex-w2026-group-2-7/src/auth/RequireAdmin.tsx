import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/auth/useAuth";

const FullScreenMessage = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-muted text-foreground flex items-center justify-center px-4">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const RequireAdmin = () => {
  const auth = useAuth();

  if (auth.isBootstrapping) {
    return <FullScreenMessage message="Checking your session..." />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
