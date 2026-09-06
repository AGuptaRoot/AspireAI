import { Router } from "express";
import {
    register,
    verifyOtp,
    resendOtp,
    login,
    refreshToken,
    logout,
    logoutAll,
    getMe,
    updateProfile,
    forgotPassword,
    resetPassword,
} from "../controllers/auth.controllers.js";
import { TestGmailOtp } from "../controllers/users.controllers.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../schemas/user.schemas.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes on /api/users
router.get("/me", authenticateUser, getMe);
router.get("/", authenticateUser, getMe);
router.put("/profile", authenticateUser, updateProfile);
router.patch("/profile", authenticateUser, updateProfile);
router.put("/", authenticateUser, updateProfile);

router.post("/register", validateSchema(registerSchema), register);
router.post("/", validateSchema(registerSchema), register);

router.post("/login", validateSchema(loginSchema), login);
router.post("/verify-otp", validateSchema(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validateSchema(resendOtpSchema), resendOtp);
router.post("/forgot-password", validateSchema(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateSchema(resetPasswordSchema), resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", authenticateUser, logoutAll);

router.get("/test", TestGmailOtp);

export default router;