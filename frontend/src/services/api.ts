import { ApiResponse, UpdateProfilePayload } from "../types";

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

        forgotPassword: (payload: { email: string }) =>
            request<ApiResponse>("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        resetPassword: (payload: { email: string; otp: string | number; newPassword: string }) =>
            request<ApiResponse>("/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        logout: () =>
            request<ApiResponse>("/api/auth/logout", {
                method: "POST",
            }),

        getMe: () => request<ApiResponse>("/api/auth/me"),

        updateProfile: (payload: UpdateProfilePayload) =>
            request<ApiResponse>("/api/auth/profile", {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
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

        chatStream: (
            payload: { query: string; resumeId?: string },
            onChunk: (chunk: string, meta?: any) => void,
            onDone?: (data?: any) => void,
            onError?: (err: any) => void
        ) => streamSse("/api/resume/chat/stream", payload, onChunk, onDone, onError),

        getChatHistory: (resumeId?: string) =>
            request<ApiResponse>(resumeId ? `/api/resume/${resumeId}/chat-history` : "/api/resume/chat-history"),

        clearChatHistory: (resumeId?: string) =>
            request<ApiResponse>(resumeId ? `/api/resume/${resumeId}/chat-history` : "/api/resume/chat-history", {
                method: "DELETE",
            }),
    },

    interview: {
        start: (payload?: { field?: string; difficulty?: string; useResume?: boolean }) =>
            request<ApiResponse>("/api/interview/start", {
                method: "POST",
                body: JSON.stringify(payload || {}),
            }),

        submit: (id: string, payload: { answers: Record<number, number>; timeSpentSeconds: number; timedOut?: boolean }) =>
            request<ApiResponse>(`/api/interview/${id}/submit`, {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        getById: (id: string) => request<ApiResponse>(`/api/interview/${id}`),

        getAll: () => request<ApiResponse>("/api/interview"),
    },

    builder: {
        generate: (payload?: { resumeId?: string; targetRole?: string; title?: string; customInstructions?: string }) =>
            request<ApiResponse>("/api/builder/generate", {
                method: "POST",
                body: JSON.stringify(payload || {}),
            }),

        generateStream: (
            payload: { resumeId?: string; targetRole?: string; title?: string; customInstructions?: string },
            onChunk: (chunk: string) => void,
            onDone?: (data?: any) => void
        ) => streamSse("/api/builder/generate/stream", payload, onChunk, onDone),

        create: (payload: { title: string; targetRole: string; content: string; blocks?: any[] }) =>
            request<ApiResponse>("/api/builder", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        getAll: () => request<ApiResponse>("/api/builder"),

        getById: (id: string) => request<ApiResponse>(`/api/builder/${id}`),

        update: (id: string, payload: { title?: string; targetRole?: string; content?: string; blocks?: any[] }) =>
            request<ApiResponse>(`/api/builder/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),

        delete: (id: string) =>
            request<ApiResponse>(`/api/builder/${id}`, {
                method: "DELETE",
            }),

        analyze: (id: string, payload?: { content?: string; blocks?: any[] }) =>
            request<ApiResponse>(`/api/builder/${id}/analyze`, {
                method: "POST",
                body: JSON.stringify(payload || {}),
            }),

        aiWrite: (payload: {
            prompt?: string;
            selectedText?: string;
            contextText?: string;
            targetRole?: string;
            action?: "improve" | "xyz" | "concise" | "roleAlign" | "grammar" | "custom";
        }) =>
            request<ApiResponse<{ rewrittenText: string }>>("/api/builder/ai-write", {
                method: "POST",
                body: JSON.stringify(payload),
            }),

        aiWriteStream: (
            payload: {
                prompt?: string;
                selectedText?: string;
                contextText?: string;
                targetRole?: string;
                action?: "improve" | "xyz" | "concise" | "roleAlign" | "grammar" | "custom";
            },
            onChunk: (chunk: string) => void,
            onDone?: (data?: any) => void
        ) => streamSse("/api/builder/ai-write/stream", payload, onChunk, onDone),
    },
};

/**
 * Generic SSE stream consumer for real-time incremental rendering
 */
export async function streamSse(
    endpoint: string,
    payload: any,
    onChunk: (chunk: string, meta?: any) => void,
    onDone?: (data?: any) => void,
    onError?: (err: any) => void
): Promise<void> {
    const url = `${BACKEND_URL}${endpoint}`;
    const token = getAuthToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            let errorMsg = `Streaming request failed with status ${response.status}`;
            try {
                const errData = await response.json();
                if (errData?.message) errorMsg = errData.message;
            } catch {
                // Ignore parse errors
            }
            throw new Error(errorMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("data: ")) {
                    try {
                        const parsed = JSON.parse(trimmed.slice(6));
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        if (parsed.meta) {
                            onChunk("", parsed.meta);
                        }
                        if (parsed.chunk) {
                            onChunk(parsed.chunk);
                        }
                        if (parsed.done) {
                            onDone?.(parsed);
                        }
                    } catch (e: any) {
                        if (e.message && !e.message.includes("JSON")) {
                            throw e;
                        }
                    }
                }
            }
        }
    } catch (err: any) {
        if (onError) onError(err);
        else {
            console.error("SSE stream error:", err);
            throw err;
        }
    }
}

