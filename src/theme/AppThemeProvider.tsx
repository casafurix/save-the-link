import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useThemeMode } from "../context/useThemeMode";
import { darkTheme, lightTheme } from "./theme";

const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const { mode } = useThemeMode();
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline>{children}</CssBaseline>
    </ThemeProvider>
  );
};

export default AppThemeProvider;
