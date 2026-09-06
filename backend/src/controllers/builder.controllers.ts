import { Request, Response } from "express";
import { BuilderResume } from "../models/builderResume.models.js";
import { Resume } from "../models/resume.models.js";
import { generateResumeWithAi, analyzeResumeWithAi, assistResumeWritingWithAi } from "../services/ai.service.js";

/**
 * Generate a new AI resume from an existing uploaded resume or profile
 * POST /api/builder/generate
 */
export const generateAiResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { resumeId, targetRole, title, customInstructions } = req.body;

        let sourceResumeText = "";
        let matchedResume = null;

        if (resumeId) {
            matchedResume = await Resume.findOne({ _id: resumeId, user: userId });
            if (matchedResume) {
                sourceResumeText = matchedResume.rawText;
            }
        } else {
            // Find latest uploaded resume if any
            matchedResume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
            if (matchedResume) {
                sourceResumeText = matchedResume.rawText;
            }
        }

        const effectiveRole = targetRole || (matchedResume?.analysis?.targetJobRoles?.[0]) || (req as any).user?.profession || "Full Stack Developer";
        const candidateName = (req as any).user?.username || "Candidate";
        const candidateEmail = (req as any).user?.email || "candidate@example.com";

        const generatedMarkdown = await generateResumeWithAi({
            existingResumeText: sourceResumeText,
            targetRole: effectiveRole,
            userName: candidateName,
            userEmail: candidateEmail,
            customInstructions,
        });

        const newResume = await BuilderResume.create({
            user: userId,
            title: title || `${effectiveRole} Resume (AI Generated)`,
            targetRole: effectiveRole,
            sourceResume: matchedResume?._id || null,
            content: generatedMarkdown,
            blocks: [],
            status: "generated",
        });

        res.status(201).json({
            success: true,
            message: "AI Resume generated successfully",
            resume: newResume,
        });
    } catch (error: any) {
        console.error("Error generating AI resume:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate AI resume",
        });
    }
};

/**
 * Create a new builder resume manually / blank draft
 * POST /api/builder
 */
export const createResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { title, targetRole, content, blocks } = req.body;

        const newResume = await BuilderResume.create({
            user: userId,
            title: title || "My Custom Resume",
            targetRole: targetRole || "Software Engineer",
            content: content || "",
            blocks: blocks || [],
            status: "draft",
        });

        res.status(201).json({
            success: true,
            message: "Resume created successfully",
            resume: newResume,
        });
    } catch (error: any) {
        console.error("Error creating resume:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create resume",
        });
    }
};

/**
 * Get all builder resumes for current user
 * GET /api/builder
 */
export const getUserResumes = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const resumes = await BuilderResume.find({ user: userId }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            resumes,
            count: resumes.length,
        });
    } catch (error: any) {
        console.error("Error fetching builder resumes:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch resumes",
        });
    }
};

/**
 * Get a single builder resume by ID
 * GET /api/builder/:id
 */
export const getResumeById = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { id } = req.params;

        const resume = await BuilderResume.findOne({ _id: id, user: userId });
        if (!resume) {
            res.status(404).json({
                success: false,
                message: "Resume not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            resume,
        });
    } catch (error: any) {
        console.error("Error fetching resume:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch resume",
        });
    }
};

/**
 * Update a builder resume (content, blocks, title, targetRole)
 * PUT /api/builder/:id
 */
export const updateResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { id } = req.params;
        const { title, targetRole, content, blocks } = req.body;

        const resume = await BuilderResume.findOne({ _id: id, user: userId });
        if (!resume) {
            res.status(404).json({
                success: false,
                message: "Resume not found",
            });
            return;
        }

        if (title !== undefined) resume.title = title;
        if (targetRole !== undefined) resume.targetRole = targetRole;
        if (content !== undefined) resume.content = content;
        if (blocks !== undefined) resume.blocks = blocks;

        await resume.save();

        res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            resume,
        });
    } catch (error: any) {
        console.error("Error updating resume:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update resume",
        });
    }
};

/**
 * Delete a builder resume
 * DELETE /api/builder/:id
 */
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { id } = req.params;

        const result = await BuilderResume.findOneAndDelete({ _id: id, user: userId });
        if (!result) {
            res.status(404).json({
                success: false,
                message: "Resume not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Resume deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting resume:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete resume",
        });
    }
};

/**
 * Analyze a builder resume (AI scoring, recommendations, ATS breakdown)
 * POST /api/builder/:id/analyze
 */
export const analyzeBuilderResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?._id;
        const { id } = req.params;
        const { content, blocks } = req.body;

        const resume = await BuilderResume.findOne({ _id: id, user: userId });
        if (!resume) {
            res.status(404).json({
                success: false,
                message: "Resume not found",
            });
            return;
        }

        // Use supplied content or saved content
        const textToAnalyze = (content !== undefined ? content : resume.content) || "";
        if (!textToAnalyze.trim()) {
            res.status(400).json({
                success: false,
                message: "Resume content cannot be empty for AI analysis",
            });
            return;
        }

        if (content !== undefined) resume.content = content;
        if (blocks !== undefined) resume.blocks = blocks;

        // Perform ATS AI analysis
        const analysisResult = await analyzeResumeWithAi(textToAnalyze, `${resume.title || "Resume"}.pdf`);

        resume.atsAnalysis = {
            ...analysisResult,
            analyzedAt: new Date(),
        };
        resume.status = "analyzed";

        await resume.save();

        res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            resume,
            analysis: resume.atsAnalysis,
        });
    } catch (error: any) {
        console.error("Error analyzing builder resume:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze resume",
        });
    }
};

/**
 * AI Writing & Editing Assistant for BlockNote
 * POST /api/builder/ai-write
 */
export const aiWriteAssistant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt, selectedText, contextText, targetRole, action } = req.body;

        if (!prompt && !selectedText && !action) {
            res.status(400).json({
                success: false,
                message: "Missing prompt or text to improve",
            });
            return;
        }

        const rewrittenText = await assistResumeWritingWithAi({
            prompt,
            selectedText,
            contextText,
            targetRole,
            action,
        });

        res.status(200).json({
            success: true,
            data: {
                rewrittenText,
            },
        });
    } catch (error: any) {
        console.error("AI write assistant error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to process AI writing request",
        });
    }
};

