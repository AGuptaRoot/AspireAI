import mongoose, { Schema } from "mongoose";
const SessionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User ID is required"],
        index: true,
    },
    refreshTokenHash: {
        type: String,
        required: [true, "Refresh token hash is required"],
        index: true,
    },
    ip: {
        type: String,
        default: "unknown",
    },
    userAgent: {
        type: String,
        default: "unknown",
    },
    revoked: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
const SessionModel = mongoose.model("session", SessionSchema);
export default SessionModel;
