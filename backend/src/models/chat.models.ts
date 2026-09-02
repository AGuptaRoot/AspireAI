import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage {
    role: "user" | "assistant";
    content: string;
    sources?: string[];
    createdAt: Date;
}

export interface IChatSession extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    resume: mongoose.Types.ObjectId;
    title: string;
    messages: IChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        sources: {
            type: [String],
            default: [],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "User reference is required"],
            index: true,
        },
        resume: {
            type: Schema.Types.ObjectId,
            ref: "resume",
            required: [true, "Resume reference is required"],
            index: true,
        },
        title: {
            type: String,
            default: "Career Assistant Chat",
        },
        messages: {
            type: [ChatMessageSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const ChatSessionModel = mongoose.model<IChatSession>("chat_session", ChatSessionSchema);

export default ChatSessionModel;
