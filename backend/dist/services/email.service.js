import nodemailer from "nodemailer";
import { config } from "../config/config.js";
/**
 * Send OTP verification email to user
 */
const sendOtpEmail = async (toEmail, otp, username = "User") => {
    try {
        if (!config.Email.AppPassword || config.Email.AppPassword.trim() === "") {
            console.warn(`⚠️ [DEV MODE] Email credentials not configured. OTP for ${toEmail}: ${otp}`);
            return {
                success: true,
                messageId: "dev-mock-mode",
            };
        }
        const transporter = nodemailer.createTransport({
            service: config.Email.Service,
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: config.Email.User,
                pass: config.Email.AppPassword.replace(/\s+/g, ""), // strip any spaces from app password
            },
        });
        const mailOptions = {
            from: config.Email.From,
            to: toEmail,
            subject: "AspireAI - Verify Your Account",
            text: `Hello ${username},\n\nYour AspireAI OTP verification code is: ${otp}\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4F46E5; margin-bottom: 5px;">AspireAI</h1>
                    <p style="color: #6B7280; font-size: 14px;">Next-Gen AI Resume & Interview Preparation</p>
                </div>
                <div style="padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
                    <h2 style="color: #111827; margin-top: 0;">Email Verification</h2>
                    <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">Hello <strong>${username}</strong>,</p>
                    <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">Thank you for registering on AspireAI. Please use the verification code below to verify your email address and activate your account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2FF; padding: 12px 24px; border-radius: 8px; border: 1px dashed #6366F1; display: inline-block;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #EF4444; font-size: 13px; margin-bottom: 0;">⏰ This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
                </div>
                <div style="text-align: center; margin-top: 25px; color: #9CA3AF; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} AspireAI. All rights reserved.</p>
                </div>
            </div>
            `,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Verification email sent to ${toEmail}: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId,
        };
    }
    catch (error) {
        console.error("❌ Failed to send email via SMTP:", error.message);
        console.warn(`ℹ️ [DEV FALLBACK] OTP for ${toEmail}: ${otp}`);
        return {
            success: false,
            error: error.message,
        };
    }
};
/**
 * Send Password Reset OTP email to user
 */
export const sendPasswordResetEmail = async (toEmail, otp, username = "User") => {
    try {
        if (!config.Email.AppPassword || config.Email.AppPassword.trim() === "") {
            console.warn(`⚠️ [DEV MODE] Email credentials not configured. Password Reset OTP for ${toEmail}: ${otp}`);
            return {
                success: true,
                messageId: "dev-mock-mode",
            };
        }
        const transporter = nodemailer.createTransport({
            service: config.Email.Service,
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: config.Email.User,
                pass: config.Email.AppPassword.replace(/\s+/g, ""),
            },
        });
        const mailOptions = {
            from: config.Email.From,
            to: toEmail,
            subject: "AspireAI - Reset Your Password",
            text: `Hello ${username},\n\nYour AspireAI password reset OTP code is: ${otp}\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4F46E5; margin-bottom: 5px;">AspireAI</h1>
                    <p style="color: #6B7280; font-size: 14px;">Next-Gen AI Resume & Interview Preparation</p>
                </div>
                <div style="padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
                    <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
                    <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">Hello <strong>${username}</strong>,</p>
                    <p style="color: #4B5563; font-size: 15px; line-height: 1.5;">We received a request to reset your password for your AspireAI account. Use the OTP code below to proceed with setting a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2FF; padding: 12px 24px; border-radius: 8px; border: 1px dashed #6366F1; display: inline-block;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #EF4444; font-size: 13px; margin-bottom: 0;">⏰ This code is valid for <strong>5 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
                </div>
                <div style="text-align: center; margin-top: 25px; color: #9CA3AF; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} AspireAI. All rights reserved.</p>
                </div>
            </div>
            `,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Password reset email sent to ${toEmail}: ${info.messageId}`);
        return {
            success: true,
            messageId: info.messageId,
        };
    }
    catch (error) {
        console.error("❌ Failed to send password reset email via SMTP:", error.message);
        console.warn(`ℹ️ [DEV FALLBACK] Password Reset OTP for ${toEmail}: ${otp}`);
        return {
            success: false,
            error: error.message,
        };
    }
};
export { sendOtpEmail };
export default sendOtpEmail;
