import { Router } from "express";
import { uploadResume, getUserResumes, getLatestResume, getResumeById, deleteResume, analyzeResume, getResumeAnalytics, chatWithAiCareerAssistant, getChatHistory, clearChatHistory, } from "../controllers/resume.controllers.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { uploadResumeFile } from "../middlewares/upload.middleware.js";
const router = Router();
// All resume routes require authentication
router.use(authenticateUser);
// 1. Upload & Parsing Endpoints
router.post("/upload", uploadResumeFile, uploadResume);
router.post("/", uploadResumeFile, uploadResume);
// 2. Resume Retrieval Endpoints
router.get("/", getUserResumes);
router.get("/latest", getLatestResume);
router.get("/latest/analytics", getResumeAnalytics);
router.get("/chat-history", getChatHistory);
router.delete("/chat-history", clearChatHistory);
// 3. AI Chat & Query with Vector Embeddings (RAG)
router.post("/chat", chatWithAiCareerAssistant);
router.post("/query", chatWithAiCareerAssistant); // Compatible with user's example
router.post("/:id/chat", chatWithAiCareerAssistant);
router.get("/:id/chat-history", getChatHistory);
router.delete("/:id/chat-history", clearChatHistory);
// 4. AI ATS Analysis Endpoints
router.post("/:id/analyze", analyzeResume);
router.get("/:id/analytics", getResumeAnalytics);
// 5. Single Resume Management
router.get("/:id", getResumeById);
router.delete("/:id", deleteResume);
export default router;
