import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "@/auth/useAuth";
import { withPathLanguage } from "@/i18n/routing";

/** Staff should use the admin dashboard, not the donor giving portal. */
const RedirectAdminFromDonorPortal = () => {
  const auth = useAuth();
  const { i18n } = useTranslation();

  if (auth.isAdmin) {
    return <Navigate to={withPathLanguage("/dashboard", i18n.resolvedLanguage)} replace />;
  }

  return <Outlet />;
};

export default RedirectAdminFromDonorPortal;
