export interface User {
    _id: string;
    username: string;
    email: string;
    profession: string;
    isVerified: boolean;
    createdAt?: string;
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

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    user?: User;
    accessToken?: string;
    resume?: Resume;
    resumes?: Resume[];
    count?: number;
    analysis?: ResumeAnalysis;
    response?: string;
    sources?: string[];
    sessionId?: string;
    messages?: ChatMessage[];
    errors?: Array<{ field: string; message: string }>;
}
