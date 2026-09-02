import { ApiResponse } from "../types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

let authToken: string | null = localStorage.getItem("aspire_access_token");

export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token) {
        localStorage.setItem("aspire_access_token", token);
    } else {
        localStorage.removeItem("aspire_access_token");
    }
};

export const getAuthToken = () => authToken;

/**
 * Centralized API client
 */
async function request<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (authToken && !headers["Authorization"]) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Don't set Content-Type if uploading FormData (browser sets boundary)
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: "include", // send cookies for RefreshToken
    };

    try {
        let response = await fetch(url, config);

        // Handle 401: Try token refresh once if access token expired
        if (response.status === 401 && !endpoint.includes("/auth/refresh-token") && !endpoint.includes("/auth/login")) {
            try {
                const refreshRes = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    if (refreshData.accessToken) {
                        setAuthToken(refreshData.accessToken);
                        headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
                        // Retry original request
                        response = await fetch(url, { ...config, headers });
                    }
                } else {
                    setAuthToken(null);
                }
            } catch {
                setAuthToken(null);
            }
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data as T;
    } catch (error: any) {
        console.error(`API Error on ${endpoint}:`, error.message);
        throw error;
    }
}

// API Endpoints
export const api = {
    auth: {
        register: (payload: { username: string; email: string; password: string; profession: string }) =>
            request<ApiResponse>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        verifyOtp: (payload: { email: string; otp: string | number }) =>
            request<ApiResponse>("/api/auth/verify-otp", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        resendOtp: (payload: { email: string }) =>
            request<ApiResponse>("/api/auth/resend-otp", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        login: (payload: { email: string; password: string }) =>
            request<ApiResponse>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        logout: () =>
            request<ApiResponse>("/api/auth/logout", {
                method: "POST",
            }),

        getMe: () => request<ApiResponse>("/api/auth/me"),
    },

    resume: {
        upload: (file: File) => {
            const formData = new FormData();
            formData.append("document", file);
            return request<ApiResponse>("/api/resume/upload", {
                method: "POST",
                body: formData,
            });
        },

        getAll: () => request<ApiResponse>("/api/resume"),

        getLatest: () => request<ApiResponse>("/api/resume/latest"),

        getLatestAnalytics: () => request<ApiResponse>("/api/resume/latest/analytics"),

        getAnalyticsById: (id: string) => request<ApiResponse>(`/api/resume/${id}/analytics`),

        analyzeById: (id: string) =>
            request<ApiResponse>(`/api/resume/${id}/analyze`, {
                method: "POST",
            }),

        getById: (id: string) => request<ApiResponse>(`/api/resume/${id}`),

        deleteById: (id: string) =>
            request<ApiResponse>(`/api/resume/${id}`, {
                method: "DELETE",
            }),

        chat: (payload: { query: string; resumeId?: string }) =>
            request<ApiResponse>("/api/resume/chat", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        getChatHistory: (resumeId?: string) =>
            request<ApiResponse>(resumeId ? `/api/resume/${resumeId}/chat-history` : "/api/resume/chat-history"),

        clearChatHistory: (resumeId?: string) =>
            request<ApiResponse>(resumeId ? `/api/resume/${resumeId}/chat-history` : "/api/resume/chat-history", {
                method: "DELETE",
            }),
    },
};
