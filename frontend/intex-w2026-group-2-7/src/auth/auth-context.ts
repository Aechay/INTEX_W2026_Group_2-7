import { createContext } from "react";
import type { CurrentUser } from "@/auth/auth-types";

export type AuthContextValue = {
  apiBaseUrl: string;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authenticatedJson: <T>(
    path: string,
    init?: Omit<RequestInit, "body"> & { body?: BodyInit | object | null },
  ) => Promise<T>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
