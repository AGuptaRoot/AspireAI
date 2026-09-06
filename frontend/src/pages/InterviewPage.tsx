import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";
import { Interview, InterviewQuestion } from "../types";
import Navbar from "../components/Navbar";
import {
    BrainCircuit,
    Timer,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Briefcase,
    Loader2,
    FileText,
    History,
    Calendar,
    ChevronRight,
} from "lucide-react";

export const InterviewPage: React.FC = () => {
    const { user, resumes } = useAppStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Configuration state
    const [field, setField] = useState(searchParams.get("field") || user?.profession || "Full Stack Developer");
    const [difficulty, setDifficulty] = useState<"Junior" | "Mid-Level" | "Senior">("Mid-Level");
    const [useResume, setUseResume] = useState(resumes.length > 0);

    // Active assessment state
    const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
    const [currentRound, setCurrentRound] = useState(0); // 0 to 9 (Rounds 1 to 10)
    const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> selectedOptionIndex
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes = 300s
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Past interviews history
    const [pastInterviews, setPastInterviews] = useState<Interview[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Track submission status to avoid double submits
    const hasSubmittedRef = useRef(false);
    const timerRef = useRef<any>(null);

    // Fetch past interview history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const res = await api.interview.getAll();
                if (res.success && res.interviews) {
                    setPastInterviews(res.interviews);
                }
            } catch (err: any) {
                console.error("Failed to load interview history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    // Handle Time-Over Auto Submit
    const handleTimeOver = useCallback(async () => {
        if (!activeInterview || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);

        try {
            const timeSpent = 300;
            const res = await api.interview.submit(activeInterview._id, {
                answers,
                timeSpentSeconds: timeSpent,
                timedOut: true,
            });

            if (res.success && res.result) {
                navigate(`/interview/result/${activeInterview._id}`, {
                    state: { result: res.result, timedOut: true },
                });
            } else {
                setError("Failed to auto-submit interview on timeout.");
            }
        } catch (err: any) {
            setError(err.message || "Auto-submission error");
        } finally {
            setIsSubmitting(false);
        }
    }, [activeInterview, answers, navigate]);

    // Timer Countdown Effect
    useEffect(() => {
        if (!activeInterview) return;

        timerRef.current = setInterval(() => {
            setTimeLeftSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeOver();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeInterview, handleTimeOver]);

    // Format seconds to mm:ss
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Start New Interview
    const handleStartInterview = async () => {
        setError(null);
        setIsGenerating(true);
        hasSubmittedRef.current = false;

        try {
            const res = await api.interview.start({
                field,
                difficulty,
                useResume,
            });

            if (res.success && res.interview) {
                setActiveInterview(res.interview);
                setCurrentRound(0);
                setAnswers({});
                setTimeLeftSeconds(res.interview.durationSeconds || 300);
            } else {
                setError(res.message || "Failed to initialize interview.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate AI interview questions.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Submit Active Interview Manually
    const handleSubmitInterview = async () => {
        if (!activeInterview || hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);

        if (timerRef.current) clearInterval(timerRef.current);

        const timeSpent = Math.max(1, 300 - timeLeftSeconds);

        try {
            const res = await api.interview.submit(activeInterview._id, {
                answers,
                timeSpentSeconds: timeSpent,
                timedOut: false,
            });

            if (res.success && res.result) {
                navigate(`/interview/result/${activeInterview._id}`, {
                    state: { result: res.result },
                });
            } else {
                setError(res.message || "Failed to submit assessment.");
                hasSubmittedRef.current = false;
            }
        } catch (err: any) {
            setError(err.message || "Submission error occurred.");
            hasSubmittedRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion: InterviewQuestion | undefined = activeInterview?.questions[currentRound];
    const totalRounds = activeInterview?.questions.length || 10;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* State 1: Pre-Interview Configuration Screen */}
                {!activeInterview && (
                    <div className="space-y-8">
                        {/* Welcome Hero Banner */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 p-8 sm:p-10 shadow-2xl">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    AI Technical Mock Interview
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                    Test Your Knowledge with{" "}
                                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        10-Round AI MCQ Assessment
                                    </span>
                                </h1>
                                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                                    Our AI Technical Interviewer generates 10 tailored questions for your domain. Test your architectural and coding concepts under a realistic 5-minute timer.
                                </p>
                            </div>

                            {/* Rules grid */}
                            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { title: "10 Rounds", desc: "Multiple Choice Questions", icon: BrainCircuit, color: "text-indigo-400" },
                                    { title: "5 Minutes", desc: "Total Time Limit", icon: Timer, color: "text-amber-400" },
                                    { title: "Tailored to Field", desc: "Your Specific Tech Stack", icon: Briefcase, color: "text-purple-400" },
                                    { title: "Instant Scorecard", desc: "Detailed Explanations", icon: CheckCircle2, color: "text-emerald-400" },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                                        <item.icon className={`w-5 h-5 ${item.color} mb-1.5`} />
                                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Configuration Form Card */}
                        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-400" />
                                Configure Your Interview
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Field Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                                        Target Role / Field of Study
                                    </label>
                                    <input
                                        type="text"
                                        value={field}
                                        onChange={(e) => setField(e.target.value)}
                                        placeholder="e.g. Full Stack Developer, React Engineer, Node.js Specialist"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {["Full Stack MERN", "Frontend React", "Backend Node.js", "Python AI/ML", "DevOps & Cloud"].map((preset, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setField(preset)}
                                                className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty Select */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                                        Seniority / Difficulty Level
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["Junior", "Mid-Level", "Senior"] as const).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setDifficulty(level)}
                                                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                    difficulty === level
                                                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                                                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Resume context toggle */}
                                    {resumes.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                                <span className="text-xs text-slate-300">Tailor with uploaded resume</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={useResume}
                                                onChange={(e) => setUseResume(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Start Button */}
                            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    <span>Duration: <strong>5 minutes</strong> (300 seconds total)</span>
                                </div>

                                <button
                                    onClick={handleStartInterview}
                                    disabled={isGenerating || !field.trim()}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>AI Generating 10 Questions...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Start 5-Minute AI Interview</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Past Assessments History */}
                        {pastInterviews.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-indigo-400" />
                                    Your Past Interview Assessments ({pastInterviews.length})
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pastInterviews.map((item) => (
                                        <div
                                            key={item._id}
                                            onClick={() => navigate(`/interview/result/${item._id}`)}
                                            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-xs font-bold text-indigo-400 truncate">
                                                        {item.field}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                                        item.passed
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    }`}>
                                                        {item.passed ? "Passed" : "Needs Review"}
                                                    </span>
                                                </div>

                                                <div className="text-2xl font-extrabold text-white my-1">
                                                    {item.score} <span className="text-xs font-medium text-slate-400">/ {item.totalQuestions} ({item.percentage}%)</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-indigo-400 font-semibold">
                                                    View Details <ChevronRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* State 2: Active 10-Round MCQ Assessment Screen */}
                {activeInterview && currentQuestion && (
                    <div className="space-y-6">
                        {/* Top Sticky Header */}
                        <div className="sticky top-20 z-40 p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
                            {/* Left: Role and round */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    R{currentRound + 1}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                                            {activeInterview.field}
                                        </h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                            {activeInterview.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Round <span className="text-indigo-400 font-bold">{currentRound + 1}</span> of {totalRounds} • {answeredCount} answered
                                    </p>
                                </div>
                            </div>

                            {/* Right: 5-minute Live Countdown Timer */}
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm sm:text-base transition-colors ${
                                    timeLeftSeconds <= 60
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
                                        : timeLeftSeconds <= 120
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                        : "bg-slate-950 border-slate-800 text-indigo-400"
                                }`}>
                                    <Timer className="w-4 h-4" />
                                    <span>{formatTime(timeLeftSeconds)}</span>
                                </div>

                                <button
                                    onClick={handleSubmitInterview}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? "Submitting..." : "Finish & Submit"}
                                </button>
                            </div>
                        </div>

                        {/* Round Pill Trackers */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                            {activeInterview.questions.map((q, idx) => {
                                const isAnswered = answers[q.questionId] !== undefined;
                                const isCurrent = currentRound === idx;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setCurrentRound(idx)}
                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                            isCurrent
                                                ? "bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md shadow-indigo-600/30 scale-105"
                                                : isAnswered
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-850"
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Question Card (Round One by One) */}
                        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm space-y-8">
                            {/* Question Title */}
                            <div>
                                <div className="flex items-center justify-between mb-3 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                    <span>Question {currentRound + 1} of {totalRounds}</span>
                                    <span>Single Choice</span>
                                </div>
                                <h2 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                                    {currentQuestion.question}
                                </h2>
                            </div>

                            {/* Options List */}
                            <div className="space-y-3.5">
                                {currentQuestion.options.map((optionText, optionIdx) => {
                                    const isSelected = answers[currentQuestion.questionId] === optionIdx;
                                    const optionLabels = ["A", "B", "C", "D"];

                                    return (
                                        <button
                                            key={optionIdx}
                                            type="button"
                                            onClick={() => {
                                                setAnswers((prev) => ({
                                                    ...prev,
                                                    [currentQuestion.questionId]: optionIdx,
                                                }));
                                            }}
                                            className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center gap-4 cursor-pointer ${
                                                isSelected
                                                    ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500"
                                                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80"
                                            }`}
                                        >
                                            {/* Badge letter */}
                                            <span
                                                className={`w-8 h-8 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected
                                                        ? "bg-indigo-600 text-white"
                                                        : "bg-slate-800 text-slate-400"
                                                }`}
                                            >
                                                {optionLabels[optionIdx]}
                                            </span>

                                            <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                                                {optionText}
                                            </span>

                                            {/* Radio Circle */}
                                            <div
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                    isSelected
                                                        ? "border-indigo-400 bg-indigo-600"
                                                        : "border-slate-700 bg-slate-900"
                                                }`}
                                            >
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Round Navigation Bar */}
                            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCurrentRound((prev) => Math.max(0, prev - 1))}
                                    disabled={currentRound === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Previous</span>
                                </button>

                                <div className="text-xs text-slate-500 font-medium">
                                    Round {currentRound + 1} / {totalRounds}
                                </div>

                                {currentRound < totalRounds - 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentRound((prev) => Math.min(totalRounds - 1, prev + 1))}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                                    >
                                        <span>Next Round</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmitInterview}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{isSubmitting ? "Scoring..." : "Submit All Answers"}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InterviewPage;
