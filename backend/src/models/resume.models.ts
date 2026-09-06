import mongoose, { Document, Schema } from "mongoose";

export interface IResumeAnalysis {
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
    analyzedAt?: Date;
}

export interface IResume extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    fileName: string;
    fileSize: number;
    mimeType: string;
    rawText: string;
    pageCount: number;
    totalChunks: number;
    chunks: string[];
    metadata?: Record<string, any>;
    analysis?: IResumeAnalysis;
    status: "uploaded" | "analyzing" | "analyzed" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "User reference is required"],
            index: true,
        },
        fileName: {
            type: String,
            required: [true, "File name is required"],
            trim: true,
        },
        fileSize: {
            type: Number,
            required: [true, "File size is required"],
        },
        mimeType: {
            type: String,
            default: "application/pdf",
        },
        rawText: {
            type: String,
            required: [true, "Resume raw text is required"],
        },
        pageCount: {
            type: Number,
            default: 1,
        },
        totalChunks: {
            type: Number,
            required: [true, "Total chunks count is required"],
        },
        chunks: {
            type: [String],
            required: [true, "Resume text chunks are required"],
            default: [],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        analysis: {
            atsScore: { type: Number },
            atsGrade: { type: String },
            summary: { type: String },
            categoryScores: {
                formatting: { type: Number },
                keywordOptimization: { type: Number },
                experienceImpact: { type: Number },
                skillsRelevance: { type: Number },
                structureReadability: { type: Number },
            },
            strengths: { type: [String], default: [] },
            weaknesses: { type: [String], default: [] },
            actionableRecommendations: { type: [String], default: [] },
            targetJobRoles: { type: [String], default: [] },
            extractedSkills: {
                technical: { type: [String], default: [] },
                soft: { type: [String], default: [] },
                tools: { type: [String], default: [] },
            },
            missingKeywords: { type: [String], default: [] },
            experienceLevel: { type: String },
            analyzedAt: { type: Date },
        },
        status: {
            type: String,
            enum: ["uploaded", "analyzing", "analyzed", "failed"],
            default: "uploaded",
        },
    },
    {
        timestamps: true,
    }
);

const ResumeModel = mongoose.model<IResume>("resume", ResumeSchema);

export const Resume = ResumeModel;
export default ResumeModel;
