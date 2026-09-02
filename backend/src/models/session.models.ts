import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    refreshTokenHash: string;
    ip?: string;
    userAgent?: string;
    revoked: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
    {
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
    },
    {
        timestamps: true,
    }
);

const SessionModel = mongoose.model<ISession>("session", SessionSchema);

export default SessionModel;