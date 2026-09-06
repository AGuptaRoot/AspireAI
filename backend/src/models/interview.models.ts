import mongoose, { Document, Schema } from "mongoose";

export interface IInterviewQuestion {
    questionId: number;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    userSelectedIndex?: number | null;
}

export interface IInterview extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    field: string;
    difficulty: "Junior" | "Mid-Level" | "Senior";
    totalQuestions: number;
    durationMinutes: number;
    timeSpentSeconds: number;
    questions: IInterviewQuestion[];
    score: number;
    percentage: number;
    passed: boolean;
    status: "in-progress" | "completed" | "timed-out";
    feedback?: string;
    createdAt: Date;
    completedAt?: Date;
}

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
    {
        questionId: { type: Number, required: true },
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correctOptionIndex: { type: Number, required: true },
        explanation: { type: String, required: true },
        userSelectedIndex: { type: Number, default: null },
    },
    { _id: false }
);

const InterviewSchema = new Schema<IInterview>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "User ID is required"],
            index: true,
        },
        field: {
            type: String,
            required: [true, "Field / Domain is required"],
            trim: true,
        },
        difficulty: {
            type: String,
            enum: ["Junior", "Mid-Level", "Senior"],
            default: "Mid-Level",
        },
        totalQuestions: {
            type: Number,
            default: 10,
        },
        durationMinutes: {
            type: Number,
            default: 5,
        },
        timeSpentSeconds: {
            type: Number,
            default: 0,
        },
        questions: {
            type: [InterviewQuestionSchema],
            required: true,
        },
        score: {
            type: Number,
            default: 0,
        },
        percentage: {
            type: Number,
            default: 0,
        },
        passed: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["in-progress", "completed", "timed-out"],
            default: "in-progress",
            index: true,
        },
        feedback: {
            type: String,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const InterviewModel = mongoose.model<IInterview>("interview", InterviewSchema);

export default InterviewModel;
