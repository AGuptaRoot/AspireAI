import React, { useState } from "react";
import { Resume } from "../types";
import { AtsScoreCircle } from "./AtsScoreCircle";
import {
    Sparkles,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    Briefcase,
    Code2,
    Copy,
    Check,
    RefreshCw,
    Layers,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";

interface ResumeAnalyticsCardProps {
    resume: Resume;
}

export const ResumeAnalyticsCard: React.FC<ResumeAnalyticsCardProps> = ({ resume }) => {
    const { analyzeResume, isAnalyzing } = useAppStore();
    const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

    const analysis = resume.analysis;

    const handleCopyKeyword = (keyword: string) => {
        navigator.clipboard.writeText(keyword);
        setCopiedKeyword(keyword);
        setTimeout(() => setCopiedKeyword(null), 2000);
    };

    if (!analysis) {
        return (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Resume Not Yet Analyzed</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
                    Run the AI ATS Scanner to calculate your score, discover missing keywords, and get custom recommendations.
                </p>
                <button
                    onClick={() => analyzeResume(resume._id)}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                    {isAnalyzing ? "Analyzing Resume..." : "Run AI Analysis"}
                </button>
            </div>
        );
    }

    const categories = [
        { name: "Keywords & Industry Alignment", score: analysis.categoryScores?.keywordOptimization || 75 },
        { name: "Experience Impact & Metrics", score: analysis.categoryScores?.experienceImpact || 70 },
        { name: "Skills Relevance & Modern Stack", score: analysis.categoryScores?.skillsRelevance || 80 },
        { name: "Formatting & ATS Layout", score: analysis.categoryScores?.formatting || 85 },
        { name: "Structure & Readability", score: analysis.categoryScores?.structureReadability || 80 },
    ];

    return (
        <div className="space-y-6">
            {/* Top Overview & Scorecard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ATS Circle Card */}
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-sm">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                        Overall Compatibility
                    </span>
                    <AtsScoreCircle
                        score={analysis.atsScore}
                        grade={analysis.atsGrade}
                        size={150}
                    />
                    <div className="mt-4 text-xs text-slate-400">
                        Experience Level: <span className="text-indigo-300 font-semibold">{analysis.experienceLevel || "Mid-Level"}</span>
                    </div>
                </div>

                {/* Category Progress Bars */}
                <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-400" />
                                Category Breakdown
                            </h4>
                            <button
                                onClick={() => analyzeResume(resume._id)}
                                disabled={isAnalyzing}
                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                title="Re-evaluate with AI"
                            >
                                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                                Re-scan
                            </button>
                        </div>

                        <div className="space-y-3.5">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-300">{cat.name}</span>
                                        <span className={`font-bold ${cat.score >= 80 ? "text-emerald-400" : cat.score >= 65 ? "text-indigo-400" : "text-amber-400"}`}>
                                            {cat.score}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                cat.score >= 80
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                                    : cat.score >= 65
                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                                                    : "bg-gradient-to-r from-amber-500 to-orange-400"
                                            }`}
                                            style={{ width: `${cat.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary text */}
                    {analysis.summary && (
                        <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 italic">
                            "{analysis.summary}"
                        </div>
                    )}
                </div>
            </div>

            {/* Target Job Roles & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Job Roles */}
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        Best Matching Target Roles
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                        Based on your profile, experience level, and tech stack:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.targetJobRoles?.map((role, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                            >
                                🎯 {role}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Missing High-Value Keywords */}
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-amber-400" />
                        Recommended Missing Keywords
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                        Add these industry keywords to your resume to increase ATS discovery:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords?.map((kw, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleCopyKeyword(kw)}
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
                                title="Click to copy"
                            >
                                <span>{kw}</span>
                                {copiedKeyword === kw ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="w-3 h-3 text-slate-400 group-hover:text-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Key Highlights & Strengths
                    </h4>
                    <ul className="space-y-2.5">
                        {analysis.strengths?.map((str, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                <span>{str}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Weaknesses / Red Flags */}
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Areas for Improvement & Gaps
                    </h4>
                    <ul className="space-y-2.5">
                        {analysis.weaknesses?.map((weak, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span>{weak}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/90 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-indigo-400" />
                    AI Actionable Recommendations to Boost ATS Score
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.actionableRecommendations?.map((rec, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300"
                        >
                            <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="leading-relaxed">{rec}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Extracted Skills Pills */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    Extracted Skills & Competencies
                </h4>
                <div className="space-y-4">
                    {/* Technical */}
                    {analysis.extractedSkills?.technical && analysis.extractedSkills.technical.length > 0 && (
                        <div>
                            <span className="text-xs font-semibold text-slate-400 block mb-2">Technical Skills:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {analysis.extractedSkills.technical.map((sk, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                        {sk}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tools */}
                    {analysis.extractedSkills?.tools && analysis.extractedSkills.tools.length > 0 && (
                        <div>
                            <span className="text-xs font-semibold text-slate-400 block mb-2">Tools & Platforms:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {analysis.extractedSkills.tools.map((sk, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                        {sk}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Soft */}
                    {analysis.extractedSkills?.soft && analysis.extractedSkills.soft.length > 0 && (
                        <div>
                            <span className="text-xs font-semibold text-slate-400 block mb-2">Soft Skills & Methodologies:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {analysis.extractedSkills.soft.map((sk, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                                        {sk}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeAnalyticsCard;
