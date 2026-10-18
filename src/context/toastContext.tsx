import {
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { Alert, Snackbar } from "@mui/material";
import { ToastContext, type ToastSeverity } from "./useToast";

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = "success") => {
      setState({ open: true, message, severity });
    },
    [],
  );

  const handleClose = () => setState((prev) => ({ ...prev, open: false }));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
