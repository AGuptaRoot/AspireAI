import React from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
    Sparkles,
    FileText,
    Bot,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    Search,
    BrainCircuit,
} from "lucide-react";
import Navbar from "../components/Navbar";

export const HomePage: React.FC = () => {
    const { isAuthenticated } = useAppStore();

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[130px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Next-Gen AI Resume & Interview Copilot
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
                        Land Your Dream Job with{" "}
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            AI Resume & ATS Intelligence
                        </span>
                    </h1>

                    <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Upload your resume to instantly receive actionable ATS scores, discover missing keywords, and chat with your personalized AI Career Coach powered by LangChain Vector RAG.
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to={isAuthenticated ? "/dashboard" : "/register"}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
                        >
                            <Sparkles className="w-5 h-5" />
                            {isAuthenticated ? "Go to Dashboard" : "Scan Your Resume Free"}
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        {!isAuthenticated && (
                            <Link
                                to="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Feature Highlights Banner */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
                        {[
                            { title: "Smart ATS Scoring", desc: "0-100 Compatibility Score", icon: TrendingUp, color: "text-emerald-400" },
                            { title: "Keyword Optimization", desc: "Find Missing Industry Terms", icon: Search, color: "text-indigo-400" },
                            { title: "Vector Embeddings RAG", desc: "Semantically Indexed Resume", icon: BrainCircuit, color: "text-purple-400" },
                            { title: "AI Career Coach", desc: "Real-time Interview Prep", icon: Bot, color: "text-pink-400" },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm"
                            >
                                <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 border-t border-slate-800/80 bg-slate-900/30 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                            Simple 3-Step Process
                        </h2>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                            How AspireAI Elevates Your Career
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Upload PDF Resume",
                                desc: "Upload your existing resume. Our backend extracts raw text with pdf-parse-new and splits it into semantic chunks.",
                                icon: FileText,
                                color: "from-indigo-500 to-blue-500",
                            },
                            {
                                step: "02",
                                title: "AI ATS Score & Breakdown",
                                desc: "Receive comprehensive scoring across keywords, impact metrics, formatting, and role match recommendations.",
                                icon: Sparkles,
                                color: "from-purple-500 to-indigo-500",
                            },
                            {
                                step: "03",
                                title: "Chat with AI Career Coach",
                                desc: "Ask questions, get tailored interview answers, and refine bullet points using Vector Embeddings RAG.",
                                icon: Bot,
                                color: "from-pink-500 to-purple-500",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-8 shadow-xl flex flex-col justify-between"
                            >
                                <div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white font-bold text-lg mb-6 shadow-lg`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                        Step {item.step}
                                    </span>
                                    <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto border-t border-slate-800/80 py-8 bg-slate-950 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4">
                    <p>© {new Date().getFullYear()} AspireAI. Next-Gen Resume & AI Interview Preparation Platform.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
