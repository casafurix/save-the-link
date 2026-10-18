import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark";
export interface ThemeModeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType | null>(null);

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (context === null) throw new Error("useThemeMode must be used inside ThemeModeProvider");
  return context;
};
