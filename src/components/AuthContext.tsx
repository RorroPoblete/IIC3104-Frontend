import React, { createContext, useContext, useMemo } from 'react';
import { useAuth0, User as Auth0User } from '@auth0/auth0-react';

type AuthUser = Pick<Auth0User, 'email' | 'name' | 'sub'> & Record<string, any>;
type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithRedirect: () => Promise<void>;
  logout: () => void;
  getAccessTokenSilently: (opts?: any) => Promise<string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  const value = useMemo(
    () => ({
      user: (user as AuthUser) || null,
      isAuthenticated: !!isAuthenticated,
      loading: !!isLoading,
      loginWithRedirect,
      logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
      getAccessTokenSilently,
    }),
    [user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

