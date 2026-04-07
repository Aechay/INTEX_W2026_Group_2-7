import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "@/auth/useAuth";

const FullScreenMessage = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-muted text-foreground flex items-center justify-center px-4">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

const RequireAuth = () => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isBootstrapping) {
    return <FullScreenMessage message="Checking your session..." />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
