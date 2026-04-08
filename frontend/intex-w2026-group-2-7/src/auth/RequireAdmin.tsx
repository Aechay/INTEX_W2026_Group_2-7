import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "@/auth/useAuth";

const SessionLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
    <div className="h-8 w-8 rounded-full border-[3px] border-primary/25 border-t-primary animate-spin" />
    <p className="text-sm text-muted-foreground">Checking your session…</p>
  </div>
);

const RequireAdmin = () => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isBootstrapping) {
    return <SessionLoader />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!auth.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
