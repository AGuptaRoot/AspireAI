import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import InterviewPage from "./pages/InterviewPage";
import InterviewResultPage from "./pages/InterviewResultPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
    },
    {
        path: "/reset-password",
        element: <ResetPasswordPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },
    {
        path: "/verify-otp",
        element: <VerifyOtpPage />,
    },
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute>
                <DashboardPage />
            </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/builder",
        element: (
            <ProtectedRoute>
                <ResumeBuilderPage />
            </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/interview",
        element: (
            <ProtectedRoute>
                <InterviewPage />
            </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/interview/result/:id",
        element: (
            <ProtectedRoute>
                <InterviewResultPage />
            </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/profile",
        element: (
            <ProtectedRoute>
                <ProfilePage />
            </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);

const App: React.FC = () => {
    const { checkAuth } = useAppStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return <RouterProvider router={router} />;
};

export default App;
