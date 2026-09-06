import { Router } from "express";
import {
    startInterview,
    submitInterview,
    getInterviewById,
    getUserInterviews,
} from "../controllers/interview.controllers.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

// All interview endpoints require authentication
router.use(authenticateUser);

router.post("/start", startInterview);
router.post("/:id/submit", submitInterview);
router.get("/:id", getInterviewById);
router.get("/", getUserInterviews);

export default router;
