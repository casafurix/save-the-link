import type React from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/useAuth";

interface PublicRoutesProps {
  children: ReactNode;
}

const PublicRoutes: React.FC<PublicRoutesProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default PublicRoutes;
