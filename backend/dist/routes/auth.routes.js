import { Router } from "express";
import { register, verifyOtp, resendOtp, login, refreshToken, logout, logoutAll, getMe, updateProfile, forgotPassword, resetPassword, } from "../controllers/auth.controllers.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema, } from "../schemas/user.schemas.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
const router = Router();
// Public Authentication Routes
router.post("/register", validateSchema(registerSchema), register);
router.post("/verify-otp", validateSchema(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validateSchema(resendOtpSchema), resendOtp);
router.post("/forgot-password", validateSchema(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateSchema(resetPasswordSchema), resetPassword);
router.post("/login", validateSchema(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
// Protected Authentication Routes
router.post("/logout-all", authenticateUser, logoutAll);
router.get("/me", authenticateUser, getMe);
router.put("/profile", authenticateUser, updateProfile);
router.patch("/profile", authenticateUser, updateProfile);
export default router;
