import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import Navbar from "../components/Navbar";
import ResumeUploader from "../components/ResumeUploader";
import ResumeAnalyticsCard from "../components/ResumeAnalyticsCard";
import CareerCoachChat from "../components/CareerCoachChat";
import {
    FileText,
    Bot,
    FolderKanban,
    Sparkles,
    Trash2,
    CheckCircle2,
    Calendar,
    Plus,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "scanner";

    const {
        user,
        resumes,
        activeResume,
        setActiveResume,
        deleteResume,
    } = useAppStore();

    const [showUploader, setShowUploader] = useState(false);

    useEffect(() => {
        // If no active resume but resumes exist, pick first
        if (!activeResume && resumes.length > 0) {
            setActiveResume(resumes[0]);
        }
    }, [resumes, activeResume, setActiveResume]);

    const setTab = (tabName: string) => {
        setSearchParams({ tab: tabName });
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* User Welcome Banner */}
                <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                                Welcome, <span className="text-indigo-400">{user?.username}</span>!
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                {user?.profession || "Candidate"}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Analyze your resume ATS compatibility, discover keyword gaps, and get personalized career guidance.
                        </p>
                    </div>

                    {/* Quick Action: Upload new */}
                    <button
                        onClick={() => {
                            setShowUploader(!showUploader);
                            setTab("scanner");
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        {showUploader ? "Close Uploader" : "Upload New Resume"}
                    </button>
                </div>

                {/* Collapsible Uploader (if toggled or no resume exists) */}
                {(showUploader || resumes.length === 0) && (
                    <div className="mb-8">
                        <ResumeUploader />
                    </div>
                )}

                {/* Dashboard Tabs Navigation */}
                <div className="flex items-center gap-2 border-b border-slate-800/80 mb-8 overflow-x-auto pb-1">
                    <button
                        onClick={() => setTab("scanner")}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === "scanner"
                                ? "text-indigo-400 border-indigo-500 bg-indigo-500/10"
                                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        ATS Scanner & Score
                    </button>

                    <button
                        onClick={() => setTab("chat")}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === "chat"
                                ? "text-purple-400 border-purple-500 bg-purple-500/10"
                                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50"
                        }`}
                    >
                        <Bot className="w-4 h-4" />
                        AI Career Coach (Vector RAG)
                    </button>

                    <button
                        onClick={() => setTab("history")}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === "history"
                                ? "text-pink-400 border-pink-500 bg-pink-500/10"
                                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50"
                        }`}
                    >
                        <FolderKanban className="w-4 h-4" />
                        Resume History ({resumes.length})
                    </button>
                </div>

                {/* Tab Content */}
                {resumes.length === 0 && !showUploader ? (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No Resumes Uploaded Yet</h3>
                        <p className="text-xs text-slate-400 mb-6">
                            Upload your resume PDF to scan its ATS score and start chatting with the AI Career Coach.
                        </p>
                        <button
                            onClick={() => setShowUploader(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            Upload Resume Now
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tab 1: ATS Scanner & Analytics */}
                        {activeTab === "scanner" && (
                            <div>
                                {activeResume && (
                                    <div className="space-y-6">
                                        {/* Active Resume Sub-header */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                                <span>Active File:</span>
                                                <span className="font-bold text-white">{activeResume.fileName}</span>
                                                <span className="text-slate-500">
                                                    ({(activeResume.fileSize / 1024).toFixed(1)} KB • {activeResume.totalChunks} Chunks)
                                                </span>
                                            </div>

                                            {resumes.length > 1 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">Switch resume:</span>
                                                    <select
                                                        value={activeResume._id}
                                                        onChange={(e) => {
                                                            const chosen = resumes.find((r) => r._id === e.target.value);
                                                            if (chosen) setActiveResume(chosen);
                                                        }}
                                                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                                    >
                                                        {resumes.map((r) => (
                                                            <option key={r._id} value={r._id}>
                                                                {r.fileName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <ResumeAnalyticsCard resume={activeResume} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 2: AI Career Coach Chat (Vector Embeddings RAG) */}
                        {activeTab === "chat" && (
                            <div>
                                <CareerCoachChat />
                            </div>
                        )}

                        {/* Tab 3: Resume History Vault */}
                        {activeTab === "history" && (
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                    <FolderKanban className="w-5 h-5 text-indigo-400" />
                                    Your Uploaded Resumes
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {resumes.map((r) => (
                                        <div
                                            key={r._id}
                                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                                activeResume?._id === r._id
                                                    ? "bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-500/10"
                                                    : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <h4 className="text-sm font-bold text-white truncate" title={r.fileName}>
                                                                {r.fileName}
                                                            </h4>
                                                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(r.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {activeResume?._id === r._id && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Active
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Score chip */}
                                                <div className="my-3 flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">ATS Score:</span>
                                                    <span className="text-xs font-extrabold text-indigo-400">
                                                        {r.analysis?.atsScore || "--"}/100
                                                    </span>
                                                    {r.analysis?.atsGrade && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                            {r.analysis.atsGrade}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                                                <button
                                                    onClick={() => {
                                                        setActiveResume(r);
                                                        setTab("scanner");
                                                    }}
                                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                                >
                                                    View ATS Report →
                                                </button>

                                                <button
                                                    onClick={() => deleteResume(r._id)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                    title="Delete Resume"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
