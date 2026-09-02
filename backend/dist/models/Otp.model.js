import mongoose, { Schema } from "mongoose";
const OtpSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"],
        index: true,
    },
    otpHash: {
        type: String,
        required: [true, "OTP hash is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // MongoDB TTL index: auto delete document after 5 minutes (300 seconds)
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000),
    },
});
const OtpModel = mongoose.model("otp", OtpSchema);
export default OtpModel;
