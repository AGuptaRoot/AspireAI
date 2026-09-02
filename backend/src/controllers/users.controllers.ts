import {
    register as Register,
    login as Login,
    verifyOtp,
    resendOtp,
    refreshToken as RefreshToken,
    logout,
    logoutAll,
    getMe as userData,
} from "./auth.controllers.js";

// Test Gmail OTP helper
import type { Request, Response } from "express";
import { generateOtp } from "../utils/generateOtp.js";
import sendOtpEmail from "../services/email.service.js";

export const TestGmailOtp = async (req: Request, res: Response) => {
    try {
        const email = req.query.email ? String(req.query.email) : "adarshguptacoder@gmail.com";
        const otp = generateOtp();
        const result = await sendOtpEmail(email, otp, "Tester");
        return res.status(200).json({
            success: true,
            message: "Test OTP executed",
            otp,
            result,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    Register,
    Login,
    verifyOtp,
    resendOtp,
    RefreshToken,
    logout,
    logoutAll,
    userData,
};
