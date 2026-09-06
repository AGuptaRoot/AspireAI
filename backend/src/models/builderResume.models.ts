import mongoose, { Document, Schema } from "mongoose";
import { IResumeAnalysis } from "./resume.models.js";

export interface IBuilderResume extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    title: string;
    targetRole: string;
    sourceResume?: mongoose.Types.ObjectId;
    content: string;
    blocks?: any[];
    atsAnalysis?: IResumeAnalysis;
    status: "draft" | "generated" | "analyzed";
    createdAt: Date;
    updatedAt: Date;
}

const BuilderResumeSchema = new Schema<IBuilderResume>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "User reference is required"],
            index: true,
        },
        title: {
            type: String,
            required: [true, "Resume title is required"],
            trim: true,
            default: "My AI Resume",
        },
        targetRole: {
            type: String,
            trim: true,
            default: "Full Stack Developer",
        },
        sourceResume: {
            type: Schema.Types.ObjectId,
            ref: "resume",
            default: null,
        },
        content: {
            type: String,
            required: [true, "Resume content is required"],
            default: "",
        },
        blocks: {
            type: Schema.Types.Mixed,
            default: [],
        },
        atsAnalysis: {
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
            enum: ["draft", "generated", "analyzed"],
            default: "draft",
        },
    },
    {
        timestamps: true,
    }
);

export const BuilderResume = mongoose.model<IBuilderResume>("BuilderResume", BuilderResumeSchema);
