import { create } from "zustand";
import { User, Resume, ChatMessage } from "../types";
import { api, setAuthToken, getAuthToken } from "../services/api";

interface AppState {
    // Auth State
    user: User | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    authLoading: boolean;
    authError: string | null;
    pendingVerificationEmail: string | null;

    // Resume State
    resumes: Resume[];
    activeResume: Resume | null;
    isUploading: boolean;
    isAnalyzing: boolean;
    resumeError: string | null;

    // Chat State
    chatMessages: ChatMessage[];
    isChatLoading: boolean;
    chatError: string | null;

    // Auth Actions
    checkAuth: () => Promise<void>;
    login: (payload: { email: string; password: string }) => Promise<boolean>;
    register: (payload: { username: string; email: string; password: string; profession: string }) => Promise<boolean>;
    verifyOtp: (payload: { email: string; otp: string | number }) => Promise<boolean>;
    resendOtp: (email: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearAuthError: () => void;

    // Resume Actions
    fetchResumes: () => Promise<void>;
    uploadResume: (file: File) => Promise<boolean>;
    setActiveResume: (resume: Resume) => void;
    analyzeResume: (id: string) => Promise<void>;
    deleteResume: (id: string) => Promise<void>;

    // Chat Actions
    fetchChatHistory: (resumeId?: string) => Promise<void>;
    sendChatMessage: (query: string, resumeId?: string) => Promise<void>;
    clearChatHistory: (resumeId?: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    authLoading: false,
    authError: null,
    pendingVerificationEmail: null,

    resumes: [],
    activeResume: null,
    isUploading: false,
    isAnalyzing: false,
    resumeError: null,

    chatMessages: [],
    isChatLoading: false,
    chatError: null,

    checkAuth: async () => {
        set({ isCheckingAuth: true });
        const token = getAuthToken();
        if (!token) {
            set({ isAuthenticated: false, user: null, isCheckingAuth: false });
            return;
        }

        try {
            const res = await api.auth.getMe();
            if (res.success && res.user) {
                set({ user: res.user, isAuthenticated: true, isCheckingAuth: false });
                // Automatically fetch user's resumes
                get().fetchResumes();
            } else {
                setAuthToken(null);
                set({ user: null, isAuthenticated: false, isCheckingAuth: false });
            }
        } catch {
            setAuthToken(null);
            set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        }
    },

    login: async ({ email, password }) => {
        set({ authLoading: true, authError: null });
        try {
            const res = await api.auth.login({ email, password });
            if (res.success && res.accessToken && res.user) {
                setAuthToken(res.accessToken);
                set({
                    user: res.user,
                    isAuthenticated: true,
                    authLoading: false,
                    authError: null,
                    pendingVerificationEmail: null,
                });
                get().fetchResumes();
                return true;
            }
            return false;
        } catch (err: any) {
            set({
                authLoading: false,
                authError: err.message || "Failed to log in",
                pendingVerificationEmail: err.requiresVerification ? email : null,
            });
            return false;
        }
    },

    register: async (payload) => {
        set({ authLoading: true, authError: null });
        try {
            const res = await api.auth.register(payload);
            if (res.success) {
                set({
                    authLoading: false,
                    pendingVerificationEmail: payload.email,
                    authError: null,
                });
                return true;
            }
            return false;
        } catch (err: any) {
            set({ authLoading: false, authError: err.message || "Registration failed" });
            return false;
        }
    },

    verifyOtp: async ({ email, otp }) => {
        set({ authLoading: true, authError: null });
        try {
            const res = await api.auth.verifyOtp({ email, otp });
            if (res.success && res.accessToken && res.user) {
                setAuthToken(res.accessToken);
                set({
                    user: res.user,
                    isAuthenticated: true,
                    authLoading: false,
                    pendingVerificationEmail: null,
                });
                get().fetchResumes();
                return true;
            }
            return false;
        } catch (err: any) {
            set({ authLoading: false, authError: err.message || "Invalid OTP code" });
            return false;
        }
    },

    resendOtp: async (email) => {
        try {
            const res = await api.auth.resendOtp({ email });
            return res.success;
        } catch (err: any) {
            set({ authError: err.message || "Failed to resend OTP" });
            return false;
        }
    },

    logout: async () => {
        try {
            await api.auth.logout();
        } catch (e) {
            console.error(e);
        }
        setAuthToken(null);
        set({
            user: null,
            isAuthenticated: false,
            resumes: [],
            activeResume: null,
            chatMessages: [],
        });
    },

    clearAuthError: () => set({ authError: null }),

    fetchResumes: async () => {
        try {
            const res = await api.resume.getAll();
            if (res.success && res.resumes) {
                set({ resumes: res.resumes });
                if (res.resumes.length > 0 && !get().activeResume) {
                    // Fetch full analytics of latest resume
                    const latestRes = await api.resume.getLatest();
                    if (latestRes.success && latestRes.resume) {
                        set({ activeResume: latestRes.resume });
                        get().fetchChatHistory(latestRes.resume._id);
                    }
                }
            }
        } catch (err: any) {
            console.error("Failed to fetch resumes:", err.message);
        }
    },

    uploadResume: async (file: File) => {
        set({ isUploading: true, resumeError: null });
        try {
            const res = await api.resume.upload(file);
            if (res.success && res.resume) {
                set((state) => ({
                    resumes: [res.resume!, ...state.resumes],
                    activeResume: res.resume,
                    isUploading: false,
                }));
                get().fetchChatHistory(res.resume._id);
                return true;
            }
            set({ isUploading: false, resumeError: "Failed to upload resume" });
            return false;
        } catch (err: any) {
            set({ isUploading: false, resumeError: err.message || "Upload error" });
            return false;
        }
    },

    setActiveResume: (resume: Resume) => {
        set({ activeResume: resume });
        get().fetchChatHistory(resume._id);
    },

    analyzeResume: async (id: string) => {
        set({ isAnalyzing: true, resumeError: null });
        try {
            const res = await api.resume.analyzeById(id);
            if (res.success && res.analysis) {
                set((state) => {
                    const updated = state.resumes.map((r) =>
                        r._id === id ? { ...r, analysis: res.analysis, status: "analyzed" as const } : r
                    );
                    const currentActive = state.activeResume?._id === id
                        ? { ...state.activeResume, analysis: res.analysis, status: "analyzed" as const }
                        : state.activeResume;
                    return { resumes: updated, activeResume: currentActive, isAnalyzing: false };
                });
            } else {
                set({ isAnalyzing: false });
            }
        } catch (err: any) {
            set({ isAnalyzing: false, resumeError: err.message || "Analysis failed" });
        }
    },

    deleteResume: async (id: string) => {
        try {
            const res = await api.resume.deleteById(id);
            if (res.success) {
                set((state) => {
                    const remaining = state.resumes.filter((r) => r._id !== id);
                    const nextActive = state.activeResume?._id === id
                        ? (remaining.length > 0 ? remaining[0] : null)
                        : state.activeResume;
                    return { resumes: remaining, activeResume: nextActive };
                });
            }
        } catch (err: any) {
            set({ resumeError: err.message || "Failed to delete resume" });
        }
    },

    fetchChatHistory: async (resumeId?: string) => {
        try {
            const res = await api.resume.getChatHistory(resumeId);
            if (res.success && res.messages) {
                set({ chatMessages: res.messages });
            } else {
                set({ chatMessages: [] });
            }
        } catch (err: any) {
            console.error("Failed to fetch chat history:", err.message);
            set({ chatMessages: [] });
        }
    },

    sendChatMessage: async (query: string, resumeId?: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const activeId = resumeId || get().activeResume?._id;

        // Optimistically add user message
        const optimisticUserMsg: ChatMessage = {
            role: "user",
            content: trimmed,
            createdAt: new Date().toISOString(),
        };

        set((state) => ({
            chatMessages: [...state.chatMessages, optimisticUserMsg],
            isChatLoading: true,
            chatError: null,
        }));

        try {
            const res = await api.resume.chat({ query: trimmed, resumeId: activeId });
            if (res.success && res.response) {
                const aiMsg: ChatMessage = {
                    role: "assistant",
                    content: res.response,
                    sources: res.sources,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    chatMessages: [...state.chatMessages, aiMsg],
                    isChatLoading: false,
                }));
            } else {
                set({ isChatLoading: false, chatError: "Failed to get AI response" });
            }
        } catch (err: any) {
            set({ isChatLoading: false, chatError: err.message || "AI Career Coach error" });
        }
    },

    clearChatHistory: async (resumeId?: string) => {
        const activeId = resumeId || get().activeResume?._id;
        try {
            await api.resume.clearChatHistory(activeId);
            set({ chatMessages: [] });
        } catch (err: any) {
            console.error("Failed to clear chat history:", err.message);
        }
    },
}));
