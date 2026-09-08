export interface User {
    _id: string;
    username: string;
    email: string;
    profession: string;
    fullName?: string;
    phone?: string;
    location?: string;
    bio?: string;
    targetRole?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    skills?: string[];
    isVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateProfilePayload {
    username?: string;
    profession?: string;
    fullName?: string;
    phone?: string;
    location?: string;
    bio?: string;
    targetRole?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    skills?: string[] | string;
}

export interface ResumeAnalysis {
    atsScore: number;
    atsGrade: "Excellent" | "Good" | "Average" | "Needs Improvement";
    summary: string;
    categoryScores: {
        formatting: number;
        keywordOptimization: number;
        experienceImpact: number;
        skillsRelevance: number;
        structureReadability: number;
    };
    strengths: string[];
    weaknesses: string[];
    actionableRecommendations: string[];
    targetJobRoles: string[];
    extractedSkills: {
        technical: string[];
        soft: string[];
        tools: string[];
    };
    missingKeywords: string[];
    experienceLevel: "Entry-Level" | "Mid-Level" | "Senior" | "Lead / Executive";
    analyzedAt?: string;
}

export interface Resume {
    _id: string;
    user: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    pageCount: number;
    totalChunks: number;
    chunks?: string[];
    rawText?: string;
    analysis?: ResumeAnalysis;
    status: "uploaded" | "analyzing" | "analyzed" | "failed";
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    sources?: string[];
    createdAt?: string;
}

export interface InterviewQuestion {
    questionId: number;
    question: string;
    options: string[];
    correctOptionIndex?: number;
    explanation?: string;
    userSelectedIndex?: number | null;
}

export interface Interview {
    _id: string;
    field: string;
    difficulty: "Junior" | "Mid-Level" | "Senior";
    totalQuestions: number;
    durationMinutes: number;
    durationSeconds?: number;
    timeSpentSeconds?: number;
    questions: InterviewQuestion[];
    score?: number;
    percentage?: number;
    passed?: boolean;
    status: "in-progress" | "completed" | "timed-out";
    feedback?: string;
    createdAt: string;
    completedAt?: string;
}

export interface BuilderResume {
    _id: string;
    user: string;
    title: string;
    targetRole: string;
    sourceResume?: string;
    content: string;
    blocks?: any[];
    atsAnalysis?: ResumeAnalysis;
    status: "draft" | "generated" | "analyzed";
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    user?: User;
    accessToken?: string;
    resume?: any;
    resumes?: any;
    count?: number;
    analysis?: ResumeAnalysis;
    response?: string;
    sources?: string[];
    sessionId?: string;
    messages?: ChatMessage[];
    interview?: Interview;
    interviews?: Interview[];
    result?: Interview;
    builderResume?: BuilderResume;
    builderResumes?: BuilderResume[];
    data?: T;
    errors?: Array<{ field: string; message: string }>;
}

