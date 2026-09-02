import crypto from "crypto";
/**
 * Generates a secure 6-digit numeric OTP
 */
export const generateOtp = () => {
    return crypto.randomInt(100000, 999999);
};
