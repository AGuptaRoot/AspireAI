import { register as Register, login as Login, verifyOtp, resendOtp, refreshToken as RefreshToken, logout, logoutAll, getMe as userData, } from "./auth.controllers.js";
import { generateOtp } from "../utils/generateOtp.js";
import sendOtpEmail from "../services/email.service.js";
export const TestGmailOtp = async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
export { Register, Login, verifyOtp, resendOtp, RefreshToken, logout, logoutAll, userData, };
