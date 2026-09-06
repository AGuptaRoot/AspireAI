import { Router } from "express";
import {
    generateAiResume,
    createResume,
    getUserResumes,
    getResumeById,
    updateResume,
    deleteResume,
    analyzeBuilderResume,
    aiWriteAssistant,
} from "../controllers/builder.controllers.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

// All builder routes require authentication
router.use(authenticateUser);

router.post("/generate", generateAiResume);
router.post("/ai-write", aiWriteAssistant);
router.post("/:id/analyze", analyzeBuilderResume);
router.get("/:id", getResumeById);
router.put("/:id", updateResume);
router.delete("/:id", deleteResume);
router.post("/", createResume);
router.get("/", getUserResumes);

export default router;
