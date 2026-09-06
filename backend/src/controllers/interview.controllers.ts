import type { Request, Response } from "express";
import mongoose from "mongoose";
import InterviewModel from "../models/interview.models.js";
import ResumeModel from "../models/resume.models.js";
import { generateMcqQuestionsForField } from "../services/ai.service.js";

/**
 * Start a new 10-round AI Interview assessment
 */
export const startInterview = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to start an interview.",
            });
        }

        const { field, difficulty, useResume } = req.body;
        const targetField = (field && String(field).trim()) || req.user.profession || "Full Stack Developer";
        const targetDifficulty = difficulty === "Senior" || difficulty === "Junior" ? difficulty : "Mid-Level";

        let resumeContext = "";
        if (useResume) {
            const resume = await ResumeModel.findOne({ user: req.user._id }).sort({ createdAt: -1 });
            if (resume && resume.rawText) {
                resumeContext = resume.rawText.slice(0, 1500);
            }
        }

        // 1. Generate 10 MCQ Questions with AI / Field Bank
        const questions = await generateMcqQuestionsForField(targetField, targetDifficulty, resumeContext);

        // 2. Create Interview document in MongoDB
        const interview = await InterviewModel.create({
            user: req.user._id,
            field: targetField,
            difficulty: targetDifficulty,
            totalQuestions: questions.length,
            durationMinutes: 5,
            timeSpentSeconds: 0,
            questions,
            status: "in-progress",
            score: 0,
            percentage: 0,
            passed: false,
        });

        // 3. Return client-safe questions (omitting correctOptionIndex and explanation)
        const clientQuestions = interview.questions.map((q) => ({
            questionId: q.questionId,
            question: q.question,
            options: q.options,
        }));

        return res.status(201).json({
            success: true,
            message: "AI Interview initialized successfully",
            interview: {
                _id: interview._id,
                field: interview.field,
                difficulty: interview.difficulty,
                totalQuestions: interview.totalQuestions,
                durationMinutes: interview.durationMinutes,
                durationSeconds: interview.durationMinutes * 60, // 300 seconds
                questions: clientQuestions,
                createdAt: interview.createdAt,
            },
        });
    } catch (error: any) {
        console.error("Start interview error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to start AI interview assessment.",
        });
    }
};

/**
 * Submit completed or timed-out interview answers and calculate score
 */
export const submitInterview = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID format.",
            });
        }

        const { answers = {}, timeSpentSeconds = 0, timedOut = false } = req.body;

        const interview = await InterviewModel.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found or access denied.",
            });
        }

        // Calculate score and mark user answers
        let score = 0;
        const total = interview.questions.length;

        interview.questions.forEach((q) => {
            // Support both questionId-keyed or 0-indexed keyed answers
            const userChoice = answers[q.questionId] !== undefined 
                ? Number(answers[q.questionId]) 
                : answers[q.questionId - 1] !== undefined 
                ? Number(answers[q.questionId - 1]) 
                : null;

            q.userSelectedIndex = userChoice;

            if (userChoice !== null && userChoice === q.correctOptionIndex) {
                score += 1;
            }
        });

        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const passed = percentage >= 60;

        let feedback = "";
        if (percentage >= 80) {
            feedback = `Outstanding performance! You demonstrated exceptional technical mastery in ${interview.field}. You are well-prepared for technical interview rounds.`;
        } else if (percentage >= 60) {
            feedback = `Solid performance! You passed the assessment for ${interview.field}. Review the explanations for missed questions to achieve mastery.`;
        } else {
            feedback = `Good effort, but further preparation is recommended in ${interview.field}. Review the detailed solutions below and retake the assessment.`;
        }

        interview.score = score;
        interview.percentage = percentage;
        interview.passed = passed;
        interview.timeSpentSeconds = Math.min(300, Math.max(0, timeSpentSeconds));
        interview.status = timedOut || timeSpentSeconds >= 300 ? "timed-out" : "completed";
        interview.feedback = feedback;
        interview.completedAt = new Date();

        await interview.save();

        return res.status(200).json({
            success: true,
            message: timedOut ? "Assessment submitted automatically due to timeout." : "Assessment submitted successfully!",
            result: {
                _id: interview._id,
                field: interview.field,
                difficulty: interview.difficulty,
                totalQuestions: interview.totalQuestions,
                score: interview.score,
                percentage: interview.percentage,
                passed: interview.passed,
                status: interview.status,
                timeSpentSeconds: interview.timeSpentSeconds,
                feedback: interview.feedback,
                completedAt: interview.completedAt,
                questions: interview.questions,
            },
        });
    } catch (error: any) {
        console.error("Submit interview error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit interview answers.",
        });
    }
};

/**
 * Get single interview by ID
 */
export const getInterviewById = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid interview ID format." });
        }

        const interview = await InterviewModel.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!interview) {
            return res.status(404).json({ success: false, message: "Interview assessment not found." });
        }

        // If in-progress, omit correct answers to prevent inspecting
        if (interview.status === "in-progress") {
            const clientQuestions = interview.questions.map((q) => ({
                questionId: q.questionId,
                question: q.question,
                options: q.options,
                userSelectedIndex: q.userSelectedIndex,
            }));

            return res.status(200).json({
                success: true,
                interview: {
                    _id: interview._id,
                    field: interview.field,
                    difficulty: interview.difficulty,
                    totalQuestions: interview.totalQuestions,
                    durationMinutes: interview.durationMinutes,
                    status: interview.status,
                    questions: clientQuestions,
                    createdAt: interview.createdAt,
                },
            });
        }

        // If completed or timed-out, return full result with answers & explanations
        return res.status(200).json({
            success: true,
            interview,
        });
    } catch (error: any) {
        console.error("Get interview error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch interview details.",
        });
    }
};

/**
 * Get all past interviews for current user
 */
export const getUserInterviews = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const interviews = await InterviewModel.find({ user: req.user._id })
            .select("-questions")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: interviews.length,
            interviews,
        });
    } catch (error: any) {
        console.error("Get user interviews error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch interview history.",
        });
    }
};
