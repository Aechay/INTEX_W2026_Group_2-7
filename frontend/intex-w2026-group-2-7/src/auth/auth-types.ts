export type AuthTokens = {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
};

export type CurrentUser = {
  userId: string;
  email: string;
  displayName: string | null;
  roles: string[];
};

export type AuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  isBootstrapping: boolean;
};
