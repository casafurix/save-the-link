import { createContext, useContext } from "react";

export type ToastSeverity = "success" | "error" | "info";
export interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === null) throw new Error("useToast must be used inside ToastProvider");
  return context;
};
