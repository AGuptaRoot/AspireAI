import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/users.models.js";
import OtpModel from "../models/Otp.model.js";
import SessionModel from "../models/session.models.js";
import { config } from "../config/config.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../services/email.service.js";
import { generateOtp } from "../utils/generateOtp.js";

// Helper: Generate SHA256 hash
const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password, profession } = req.body;

        // 1. Check if user already exists
        const existingUser = await userModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email address already exists.",
            });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user (unverified by default)
        const newUser = await userModel.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            profession,
            isVerified: false,
        });

        // 4. Generate OTP & save hashed OTP
        const otp = generateOtp();
        const otpHash = hashToken(String(otp));

        await OtpModel.create({
            email: newUser.email,
            user: newUser._id,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        // 5. Send OTP verification email
        await sendOtpEmail(newUser.email, otp, newUser.username);

        return res.status(201).json({
            success: true,
            message: "User registered successfully. An OTP has been sent to your email.",
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                profession: newUser.profession,
                isVerified: newUser.isVerified,
            },
        });
    } catch (error: any) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to register user",
        });
    }
};

/**
 * Verify OTP and activate user account
 */
export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = String(email).toLowerCase().trim();
        const otpHash = hashToken(String(otp).trim());

        // 1. Find OTP document
        const otpRecord = await OtpModel.findOne({
            email: normalizedEmail,
            otpHash,
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP code.",
            });
        }

        // Check if expired
        if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
            await OtpModel.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: "OTP code has expired. Please request a new one.",
            });
        }

        // 2. Mark user as verified
        const updatedUser = await userModel.findByIdAndUpdate(
            otpRecord.user,
            { isVerified: true },
            { returnDocument: "after" }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User account not found.",
            });
        }

        // 3. Clean up OTPs for this user
        await OtpModel.deleteMany({ user: otpRecord.user });

        // 4. Create login session
        const refreshToken = jwt.sign(
            { id: updatedUser._id },
            config.Jwt_Secret,
            { expiresIn: config.Jwt_Refresh_Expires_In } as jwt.SignOptions
        );

        const refreshTokenHash = hashToken(refreshToken);

        const session = await SessionModel.create({
            user: updatedUser._id,
            refreshTokenHash,
            ip: req.ip || req.socket.remoteAddress || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const accessToken = jwt.sign(
            { id: updatedUser._id, sessionId: session._id },
            config.Jwt_Secret,
            { expiresIn: config.Jwt_Access_Expires_In } as jwt.SignOptions
        );

        // 5. Set refresh token cookie
        res.cookie("RefreshToken", refreshToken, {
            httpOnly: true,
            secure: config.Node_env === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Account verified and logged in successfully!",
            accessToken,
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profession: updatedUser.profession,
                isVerified: updatedUser.isVerified,
            },
        });
    } catch (error: any) {
        console.error("OTP verification error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify OTP",
        });
    }
};

/**
 * Resend OTP
 */
export const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email).toLowerCase().trim();

        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address.",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "This account is already verified. You can log in directly.",
            });
        }

        // Delete old OTPs
        await OtpModel.deleteMany({ user: user._id });

        // Generate new OTP
        const otp = generateOtp();
        const otpHash = hashToken(String(otp));

        await OtpModel.create({
            email: user.email,
            user: user._id,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await sendOtpEmail(user.email, otp, user.username);

        return res.status(200).json({
            success: true,
            message: "A new OTP code has been sent to your email address.",
        });
    } catch (error: any) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to resend OTP",
        });
    }
};

/**
 * User Login
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email).toLowerCase().trim();

        // 1. Find user by email
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // 2. Compare password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // 3. Check if user is verified
        if (!user.isVerified) {
            // Automatically generate and send a new OTP if unverified
            const otp = generateOtp();
            const otpHash = hashToken(String(otp));

            await OtpModel.deleteMany({ user: user._id });
            await OtpModel.create({
                email: user.email,
                user: user._id,
                otpHash,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            });

            await sendOtpEmail(user.email, otp, user.username);

            return res.status(403).json({
                success: false,
                requiresVerification: true,
                message: "Account not verified. A new OTP has been sent to your email.",
                email: user.email,
            });
        }

        // 4. Generate Refresh Token
        const refreshToken = jwt.sign(
            { id: user._id },
            config.Jwt_Secret,
            { expiresIn: config.Jwt_Refresh_Expires_In } as jwt.SignOptions
        );

        const refreshTokenHash = hashToken(refreshToken);

        // 5. Create Session in Database
        const session = await SessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip || req.socket.remoteAddress || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        // 6. Generate Access Token with embedded sessionId
        const accessToken = jwt.sign(
            { id: user._id, sessionId: session._id },
            config.Jwt_Secret,
            { expiresIn: config.Jwt_Access_Expires_In } as jwt.SignOptions
        );

        // 7. Set HTTP-Only Cookie
        res.cookie("RefreshToken", refreshToken, {
            httpOnly: true,
            secure: config.Node_env === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            accessToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profession: user.profession,
                isVerified: user.isVerified,
            },
        });
    } catch (error: any) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to log in",
        });
    }
};

/**
 * Refresh Access Token using Refresh Token
 */
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.RefreshToken || req.body?.refreshToken;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is missing.",
            });
        }

        // 1. Verify token signature
        let decoded: any;
        try {
            decoded = jwt.verify(token, config.Jwt_Secret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token. Please login again.",
            });
        }

        // 2. Check session in database
        const incomingHash = hashToken(token);
        const session = await SessionModel.findOne({
            refreshTokenHash: incomingHash,
            revoked: false,
        });

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session is revoked or invalid. Please login again.",
            });
        }

        // 3. Issue new tokens (Token Rotation)
        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            config.Jwt_Secret,
            { expiresIn: config.Jwt_Refresh_Expires_In } as jwt.SignOptions
        );

        const newRefreshTokenHash = hashToken(newRefreshToken);

        // Update session
        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        const newAccessToken = jwt.sign(
            { id: decoded.id, sessionId: session._id },
            config.Jwt_Secret,
            { expiresIn: config.Jwt_Access_Expires_In } as jwt.SignOptions
        );

        // Set rotated cookie
        res.cookie("RefreshToken", newRefreshToken, {
            httpOnly: true,
            secure: config.Node_env === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error: any) {
        console.error("Refresh token error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to refresh token",
        });
    }
};

/**
 * Logout (Revoke current session)
 */
export const logout = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.RefreshToken || req.body?.refreshToken;

        if (token) {
            const incomingHash = hashToken(token);
            await SessionModel.findOneAndUpdate(
                { refreshTokenHash: incomingHash },
                { revoked: true }
            );
        }

        if (req.sessionId) {
            await SessionModel.findByIdAndUpdate(req.sessionId, { revoked: true });
        }

        res.clearCookie("RefreshToken", {
            httpOnly: true,
            secure: config.Node_env === "production",
            sameSite: "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error: any) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to log out",
        });
    }
};

/**
 * Logout from all devices (Revoke all user sessions)
 */
export const logoutAll = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        await SessionModel.updateMany(
            { user: req.user._id, revoked: false },
            { revoked: true }
        );

        res.clearCookie("RefreshToken", {
            httpOnly: true,
            secure: config.Node_env === "production",
            sameSite: "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices successfully",
        });
    } catch (error: any) {
        console.error("Logout all error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to log out all sessions",
        });
    }
};

/**
 * Get Current Logged In User Profile
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated",
            });
        }

        return res.status(200).json({
            success: true,
            user: req.user,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve user profile",
        });
    }
};

/**
 * Update Current Logged In User Profile
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated",
            });
        }

        const userId = req.user._id;
        const {
            username,
            profession,
            fullName,
            phone,
            location,
            bio,
            targetRole,
            linkedinUrl,
            githubUrl,
            portfolioUrl,
            skills,
        } = req.body;

        const updateData: Record<string, any> = {};

        // Username validation & uniqueness check
        if (username !== undefined) {
            const trimmedUsername = String(username).trim();
            if (trimmedUsername.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be at least 3 characters long",
                });
            }
            if (trimmedUsername.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Username cannot exceed 50 characters",
                });
            }

            const existing = await userModel.findOne({
                _id: { $ne: userId },
                username: trimmedUsername,
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Username is already taken by another user",
                });
            }
            updateData.username = trimmedUsername;
        }

        // Profession validation
        if (profession !== undefined) {
            const trimmedProf = String(profession).trim();
            if (trimmedProf.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Profession must be at least 2 characters long",
                });
            }
            updateData.profession = trimmedProf;
        }

        if (fullName !== undefined) {
            updateData.fullName = String(fullName).trim();
        }

        if (phone !== undefined) {
            updateData.phone = String(phone).trim();
        }

        if (location !== undefined) {
            updateData.location = String(location).trim();
        }

        if (bio !== undefined) {
            updateData.bio = String(bio).trim();
        }

        if (targetRole !== undefined) {
            updateData.targetRole = String(targetRole).trim();
        }

        if (linkedinUrl !== undefined) {
            updateData.linkedinUrl = String(linkedinUrl).trim();
        }

        if (githubUrl !== undefined) {
            updateData.githubUrl = String(githubUrl).trim();
        }

        if (portfolioUrl !== undefined) {
            updateData.portfolioUrl = String(portfolioUrl).trim();
        }

        if (skills !== undefined) {
            if (Array.isArray(skills)) {
                updateData.skills = skills.map((s) => String(s).trim()).filter(Boolean);
            } else if (typeof skills === "string") {
                updateData.skills = skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error: any) {
        console.error("Update profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};

/**
 * Forgot Password - Send Reset OTP
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = String(email).toLowerCase().trim();

        // 1. Verify user exists
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address.",
            });
        }

        // 2. Delete any existing password reset OTPs for this user
        await OtpModel.deleteMany({ user: user._id, purpose: "password_reset" });

        // 3. Generate new OTP & save hashed OTP
        const otp = generateOtp();
        const otpHash = hashToken(String(otp));

        await OtpModel.create({
            email: user.email,
            user: user._id,
            otpHash,
            purpose: "password_reset",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        // 4. Send Password Reset OTP email
        await sendPasswordResetEmail(user.email, otp, user.username);

        return res.status(200).json({
            success: true,
            message: "A password reset code has been sent to your email address.",
        });
    } catch (error: any) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process forgot password request",
        });
    }
};

/**
 * Reset Password with OTP & new password
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;
        const normalizedEmail = String(email).toLowerCase().trim();
        const otpHash = hashToken(String(otp).trim());

        // 1. Verify user exists
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address.",
            });
        }

        // 2. Find matching OTP
        const otpRecord = await OtpModel.findOne({
            email: normalizedEmail,
            otpHash,
            purpose: "password_reset",
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset code.",
            });
        }

        // Check expiration
        if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
            await OtpModel.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: "Password reset code has expired. Please request a new code.",
            });
        }

        // 3. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update user's password and ensure verified
        user.password = hashedPassword;
        user.isVerified = true;
        await user.save();

        // 5. Delete password reset OTPs
        await OtpModel.deleteMany({ user: user._id, purpose: "password_reset" });

        // 6. Revoke all active sessions for security
        await SessionModel.updateMany(
            { user: user._id, revoked: false },
            { revoked: true }
        );

        // 7. Clear refresh token cookie if present
        res.clearCookie("RefreshToken", {
            httpOnly: true,
            secure: config.Node_env === "production",
            sameSite: "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Password reset successfully! You can now log in with your new password.",
        });
    } catch (error: any) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reset password",
        });
    }
};

