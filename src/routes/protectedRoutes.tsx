import type React from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/useAuth";

interface ProtectedRoutesProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRoutesProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
