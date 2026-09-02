import ResumeModel from "../models/resume.models.js";
import ChatSessionModel from "../models/chat.models.js";
import { parsePdfBuffer } from "../services/resumeParser.service.js";
import { analyzeResumeWithAi, queryResumeVectorStore } from "../services/ai.service.js";
import mongoose from "mongoose";
/**
 * Upload and parse resume PDF, run AI ATS analysis, and store in MongoDB
 */
export const uploadResume = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to upload resume.",
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please upload a PDF resume using field 'document' or 'resume'.",
            });
        }
        const { originalname, size, mimetype, buffer } = req.file;
        // 1. Parse PDF with pdf-parse-new and split text with LangChain RecursiveCharacterTextSplitter
        const parsed = await parsePdfBuffer(buffer, 1000, 100);
        // 2. Perform AI ATS Score Analysis and Analytics
        let analysis;
        try {
            analysis = await analyzeResumeWithAi(parsed.rawText, originalname);
        }
        catch (analysisErr) {
            console.error("AI Analysis failed during upload, proceeding with upload:", analysisErr);
        }
        // 3. Save Resume to MongoDB with userId reference, parsed text, chunks, and AI analysis
        const resumeDocument = await ResumeModel.create({
            user: req.user._id,
            fileName: originalname,
            fileSize: size,
            mimeType: mimetype || "application/pdf",
            rawText: parsed.rawText,
            pageCount: parsed.pageCount,
            chunks: parsed.chunks,
            totalChunks: parsed.totalChunks,
            metadata: parsed.metadata,
            analysis,
            status: analysis ? "analyzed" : "uploaded",
        });
        return res.status(201).json({
            success: true,
            message: "Resume uploaded, parsed, and analyzed successfully!",
            resume: {
                _id: resumeDocument._id,
                userId: req.user._id,
                fileName: resumeDocument.fileName,
                fileSize: resumeDocument.fileSize,
                pageCount: resumeDocument.pageCount,
                totalChunks: resumeDocument.totalChunks,
                chunksSample: resumeDocument.chunks.slice(0, 3),
                analysis: resumeDocument.analysis,
                createdAt: resumeDocument.createdAt,
            },
        });
    }
    catch (error) {
        console.error("Resume upload error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process and upload resume.",
        });
    }
};
/**
 * Trigger AI ATS Analysis for a specific resume
 */
export const analyzeResume = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid resume ID format" });
        }
        const resume = await ResumeModel.findOne({ _id: id, user: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: "Resume not found" });
        }
        // Run AI ATS analysis
        const analysis = await analyzeResumeWithAi(resume.rawText, resume.fileName);
        resume.analysis = analysis;
        resume.status = "analyzed";
        await resume.save();
        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully!",
            analysis,
        });
    }
    catch (error) {
        console.error("Resume analysis error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze resume",
        });
    }
};
/**
 * Get ATS Report and Analytics for a resume
 */
export const getResumeAnalytics = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        let resume;
        if (id && id !== "latest") {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: "Invalid resume ID" });
            }
            resume = await ResumeModel.findOne({ _id: id, user: req.user._id });
        }
        else {
            resume = await ResumeModel.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        }
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "No resume found. Please upload a resume first.",
            });
        }
        // If not yet analyzed, generate analysis on the fly
        if (!resume.analysis || !resume.analysis.atsScore) {
            const analysis = await analyzeResumeWithAi(resume.rawText, resume.fileName);
            resume.analysis = analysis;
            resume.status = "analyzed";
            await resume.save();
        }
        return res.status(200).json({
            success: true,
            resumeId: resume._id,
            fileName: resume.fileName,
            analysis: resume.analysis,
        });
    }
    catch (error) {
        console.error("Get analytics error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get resume analytics",
        });
    }
};
/**
 * Chat with AI Career Coach using Vector Embeddings and RAG
 * 1. Takes query and userId/resumeId
 * 2. Fetches resume text chunks from DB
 * 3. Uses vector embeddings to retrieve relevant text (result)
 * 4. Passes query and result to AI model for reply
 */
export const chatWithAiCareerAssistant = async (req, res) => {
    try {
        const targetUserId = req.user?._id || req.body.userId;
        const { query, resumeId } = req.body;
        if (!targetUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication or userId is required.",
            });
        }
        if (!query || typeof query !== "string" || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Question or query is required.",
            });
        }
        // 1. Find target resume
        let resume;
        if (resumeId && mongoose.Types.ObjectId.isValid(resumeId)) {
            resume = await ResumeModel.findOne({ _id: resumeId, user: targetUserId });
        }
        else {
            resume = await ResumeModel.findOne({ user: targetUserId }).sort({ createdAt: -1 });
        }
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "No resume found for this user. Please upload your resume first before chatting.",
            });
        }
        // 2. Find or initialize Chat Session
        let chatSession = await ChatSessionModel.findOne({
            user: targetUserId,
            resume: resume._id,
        });
        if (!chatSession) {
            chatSession = await ChatSessionModel.create({
                user: targetUserId,
                resume: resume._id,
                title: `Career Chat for ${resume.fileName}`,
                messages: [],
            });
        }
        // 3. Query Vector Store with LangChain RAG (Vector Embedding -> result text -> AI prompt -> reply)
        const { answer, relevantChunks, resultText } = await queryResumeVectorStore(resume.chunks, query.trim(), chatSession.messages);
        // 4. Save messages in chat history
        chatSession.messages.push({
            role: "user",
            content: query.trim(),
            createdAt: new Date(),
        });
        chatSession.messages.push({
            role: "assistant",
            content: answer,
            sources: relevantChunks,
            createdAt: new Date(),
        });
        await chatSession.save();
        return res.status(200).json({
            success: true,
            response: answer,
            result: resultText,
            sources: relevantChunks,
            sessionId: chatSession._id,
            totalMessages: chatSession.messages.length,
        });
    }
    catch (error) {
        console.error("AI Career Chat error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate AI career response",
        });
    }
};
/**
 * Get Chat History for a Resume
 */
export const getChatHistory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        let resume;
        if (id && id !== "latest") {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: "Invalid resume ID" });
            }
            resume = await ResumeModel.findOne({ _id: id, user: req.user._id });
        }
        else {
            resume = await ResumeModel.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        }
        if (!resume) {
            return res.status(404).json({ success: false, message: "No resume found" });
        }
        const chatSession = await ChatSessionModel.findOne({
            user: req.user._id,
            resume: resume._id,
        });
        return res.status(200).json({
            success: true,
            resumeId: resume._id,
            sessionId: chatSession?._id,
            messages: chatSession?.messages || [],
        });
    }
    catch (error) {
        console.error("Get chat history error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve chat history",
        });
    }
};
/**
 * Clear Chat History
 */
export const clearChatHistory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        let resume;
        if (id && id !== "latest") {
            resume = await ResumeModel.findOne({ _id: id, user: req.user._id });
        }
        else {
            resume = await ResumeModel.findOne({ user: req.user._id }).sort({ createdAt: -1 });
        }
        if (resume) {
            await ChatSessionModel.findOneAndDelete({
                user: req.user._id,
                resume: resume._id,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Chat history cleared successfully",
        });
    }
    catch (error) {
        console.error("Clear chat history error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to clear chat history",
        });
    }
};
/**
 * Get all resumes for current logged-in user
 */
export const getUserResumes = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const resumes = await ResumeModel.find({ user: req.user._id })
            .select("-rawText -chunks")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: resumes.length,
            resumes,
        });
    }
    catch (error) {
        console.error("Get resumes error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve resumes",
        });
    }
};
/**
 * Get latest active resume of the logged-in user
 */
export const getLatestResume = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const latestResume = await ResumeModel.findOne({ user: req.user._id })
            .sort({ createdAt: -1 });
        if (!latestResume) {
            return res.status(404).json({
                success: false,
                message: "No resume found for this user. Please upload a resume first.",
            });
        }
        return res.status(200).json({
            success: true,
            resume: latestResume,
        });
    }
    catch (error) {
        console.error("Get latest resume error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve latest resume",
        });
    }
};
/**
 * Get a single resume by ID
 */
export const getResumeById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID format",
            });
        }
        const resume = await ResumeModel.findOne({
            _id: id,
            user: req.user._id,
        });
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied.",
            });
        }
        return res.status(200).json({
            success: true,
            resume,
        });
    }
    catch (error) {
        console.error("Get resume by id error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve resume",
        });
    }
};
/**
 * Delete a resume by ID
 */
export const deleteResume = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID format",
            });
        }
        const deletedResume = await ResumeModel.findOneAndDelete({
            _id: id,
            user: req.user._id,
        });
        if (!deletedResume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied.",
            });
        }
        // Also delete associated chat sessions
        await ChatSessionModel.deleteMany({ resume: id });
        return res.status(200).json({
            success: true,
            message: "Resume and associated chat data deleted successfully",
            deletedId: deletedResume._id,
        });
    }
    catch (error) {
        console.error("Delete resume error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete resume",
        });
    }
};
