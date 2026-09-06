import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { Interview } from "../types";
import Navbar from "../components/Navbar";
import confetti from "canvas-confetti";
import {
    CheckCircle2,
    XCircle,
    RotateCcw,
    LayoutDashboard,
    Clock,
    Award,
    AlertCircle,
    HelpCircle,
    Loader2,
    BrainCircuit,
    Timer,
    Check,
    X,
} from "lucide-react";

export const InterviewResultPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const [interview, setInterview] = useState<Interview | null>(
        (location.state as any)?.result || null
    );
    const [loading, setLoading] = useState(!interview);
    const [error, setError] = useState<string | null>(null);

    const isTimedOut = (location.state as any)?.timedOut || interview?.status === "timed-out";

    useEffect(() => {
        if (!interview && id) {
            const fetchResult = async () => {
                setLoading(true);
                try {
                    const res = await api.interview.getById(id);
                    if (res.success && res.interview) {
                        setInterview(res.interview);
                        if (res.interview.passed) {
                            triggerConfetti();
                        }
                    } else {
                        setError(res.message || "Failed to load interview results.");
                    }
                } catch (err: any) {
                    setError(err.message || "Error retrieving interview scorecard.");
                } finally {
                    setLoading(false);
                }
            };
            fetchResult();
        } else if (interview && interview.passed) {
            triggerConfetti();
        }
    }, [id, interview]);

    const triggerConfetti = () => {
        try {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        } catch {
            // ignore if confetti fails
        }
    };

    const formatTimeSpent = (secs: number = 0) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                    <p className="text-sm text-slate-300">Calculating your AI Interview scorecard and solutions...</p>
                </div>
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                    <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Scorecard Not Found</h2>
                    <p className="text-xs text-slate-400 mb-6">{error || "Could not retrieve the specified interview results."}</p>
                    <Link
                        to="/interview"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
                    >
                        Start New Interview
                    </Link>
                </div>
            </div>
        );
    }

    const percentage = interview.percentage || 0;
    const score = interview.score || 0;
    const total = interview.totalQuestions || 10;
    const passed = interview.passed;

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Time Out Alert if applicable */}
                {isTimedOut && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center gap-3">
                        <Timer className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>
                            <strong>5-Minute Timer Expired!</strong> Your assessment was automatically submitted and scored with your chosen answers.
                        </span>
                    </div>
                )}

                {/* Top Scorecard Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl backdrop-blur-sm">
                    {/* Background glow */}
                    <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${
                        passed ? "bg-emerald-500/20" : "bg-indigo-500/20"
                    }`} />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Left: Performance Details */}
                        <div className="space-y-3 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
                                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                                {interview.field} • {interview.difficulty} Level
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                {passed ? "Assessment Passed! 🎉" : "Assessment Complete"}
                            </h1>

                            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                                {interview.feedback}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    Time Taken: <strong className="text-white">{formatTimeSpent(interview.timeSpentSeconds)}</strong> / 5m
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <HelpCircle className="w-4 h-4 text-purple-400" />
                                    Questions: <strong className="text-white">{total} Rounds</strong>
                                </span>
                            </div>
                        </div>

                        {/* Right: Big Score Circular Card */}
                        <div className="flex flex-col items-center justify-center shrink-0">
                            <div className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${
                                passed
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/20"
                                    : "border-amber-500 bg-amber-500/10 text-amber-400 shadow-amber-500/20"
                            }`}>
                                <span className="text-4xl font-extrabold text-white leading-none">
                                    {score}<span className="text-lg text-slate-400 font-normal">/{total}</span>
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider mt-1">
                                    {percentage}% Score
                                </span>
                            </div>

                            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${
                                passed
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            }`}>
                                {passed ? "TECHNICAL READY" : "PRACTICE RECOMMENDED"}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Return to Dashboard</span>
                        </Link>

                        <button
                            onClick={() => navigate("/interview")}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Take Another Interview</span>
                        </button>
                    </div>
                </div>

                {/* Question-by-Question Detailed Review (All 10 Rounds) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            Detailed Solutions & Round Review
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                            {score} of {total} correct
                        </span>
                    </div>

                    <div className="space-y-4">
                        {interview.questions.map((q, idx) => {
                            const isCorrect = q.userSelectedIndex === q.correctOptionIndex;
                            const hasAnswered = q.userSelectedIndex !== null && q.userSelectedIndex !== undefined;
                            const optionLetters = ["A", "B", "C", "D"];

                            return (
                                <div
                                    key={idx}
                                    className={`p-6 rounded-2xl border transition-all ${
                                        isCorrect
                                            ? "bg-slate-900/80 border-emerald-500/30 shadow-md shadow-emerald-500/5"
                                            : "bg-slate-900/80 border-rose-500/30 shadow-md shadow-rose-500/5"
                                    }`}
                                >
                                    {/* Round badge & status */}
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Round {q.questionId || idx + 1} of {total}
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                isCorrect
                                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                            }`}
                                        >
                                            {isCorrect ? (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Correct (+1)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>{hasAnswered ? "Incorrect (0)" : "Unanswered (0)"}</span>
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    {/* Question Text */}
                                    <h4 className="text-base font-bold text-white mb-4 leading-relaxed">
                                        {q.question}
                                    </h4>

                                    {/* Options Comparison */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = q.userSelectedIndex === optIdx;
                                            const isThisCorrect = q.correctOptionIndex === optIdx;

                                            let borderClass = "border-slate-800 bg-slate-950/60 text-slate-400";
                                            let badgeClass = "bg-slate-800 text-slate-400";

                                            if (isThisCorrect) {
                                                borderClass = "border-emerald-500/80 bg-emerald-500/10 text-emerald-200 font-medium";
                                                badgeClass = "bg-emerald-500 text-white";
                                            } else if (isSelected && !isThisCorrect) {
                                                borderClass = "border-rose-500/80 bg-rose-500/10 text-rose-200";
                                                badgeClass = "bg-rose-500 text-white";
                                            }

                                            return (
                                                <div
                                                    key={optIdx}
                                                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${borderClass}`}
                                                >
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 ${badgeClass}`}>
                                                            {optionLetters[optIdx]}
                                                        </span>
                                                        <span className="truncate">{opt}</span>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {isThisCorrect && (
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                                                <Check className="w-3.5 h-3.5" /> Correct
                                                            </span>
                                                        )}
                                                        {isSelected && !isThisCorrect && (
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                                                                <X className="w-3.5 h-3.5" /> Your choice
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* AI Explanation Box */}
                                    {q.explanation && (
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                                            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                                <strong className="text-indigo-300 font-semibold">Concept Explanation: </strong>
                                                <span>{q.explanation}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default InterviewResultPage;
