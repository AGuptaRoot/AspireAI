import mongoose, { Schema } from "mongoose";
const ChatMessageSchema = new Schema({
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
}, { _id: false });
const ChatSessionSchema = new Schema({
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
}, {
    timestamps: true,
});
const ChatSessionModel = mongoose.model("chat_session", ChatSessionSchema);
export default ChatSessionModel;
