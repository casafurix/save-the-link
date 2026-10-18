import React, { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "../models/user";
import { GetMe, LogoutRequest } from "./api";
import { AuthContext } from "./useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const login = (user: User) => {
    setUser(user);
  };

  const logout = () => {
    setUser(null);
    queryClient.clear();
    LogoutRequest().catch(() => {});
  };

  useEffect(() => {
    GetMe()
      .then((response) => setUser(response.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const isLoggedIn = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoggedIn,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
