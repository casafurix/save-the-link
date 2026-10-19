import { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Route, Routes } from "react-router";
import PublicRoutes from "./publicRoutes";
import ProtectedRoute from "./protectedRoutes";
import AppLayout from "../layouts/AppLayout";

const RegisterScreen = lazy(() => import("../screens/register_screen/registerScreen"));
const LoginScreen = lazy(() => import("../screens/login_screen/loginScreen"));
const HomeScreen = lazy(() => import("../screens/home_screen/home_screen"));
const PageScreen = lazy(() => import("../screens/page_screen/pageScreen"));
const PublicPageScreen = lazy(() => import("../screens/public_page_screen/publicPageScreen"));
const SettingsScreen = lazy(() => import("../screens/settings_screen/settingsScreen"));
const ExplorePublicLibrary = lazy(() => import("../screens/explore_public_library/ExplorePublicLibrary"));

const routeFallback = (
  <Box sx={{ display: "flex", justifyContent: "center", pt: 8, width: "100%" }}>
    <CircularProgress size={24} />
  </Box>
);

export const MainRoutes = () => {
  return (
    <Routes>
      <Route
        path="/register"
        element={
          <PublicRoutes>
            <Suspense fallback={routeFallback}><RegisterScreen /></Suspense>
          </PublicRoutes>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoutes>
            <Suspense fallback={routeFallback}><LoginScreen /></Suspense>
          </PublicRoutes>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Suspense fallback={routeFallback}><HomeScreen /></Suspense>} />
        <Route path="/pages/:pageId" element={<Suspense fallback={routeFallback}><PageScreen /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={routeFallback}><SettingsScreen /></Suspense>} />
        <Route path="/explore" element={<Suspense fallback={routeFallback}><ExplorePublicLibrary /></Suspense>} />
      </Route>
      <Route path="/p/:slug" element={<Suspense fallback={routeFallback}><PublicPageScreen /></Suspense>} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
