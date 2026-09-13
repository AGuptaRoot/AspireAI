import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import {
    Send,
    Bot,
    User as UserIcon,
    Sparkles,
    Trash2,
    Loader2,
    ChevronDown,
    ChevronUp,
    FileText,
    Zap,
    Brain,
} from "lucide-react";

export const CareerCoachChat: React.FC = () => {
    const {
        activeResume,
        chatMessages,
        isChatLoading,
        chatError,
        chatMode,
        setChatMode,
        sendChatMessage,
        clearChatHistory,
    } = useAppStore();

    const [input, setInput] = useState("");
    const [openSourcesIdx, setOpenSourcesIdx] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, isChatLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isChatLoading) return;

        const query = input;
        setInput("");
        await sendChatMessage(query, activeResume?._id);
    };

    const handleSuggestedPrompt = (prompt: string) => {
        setInput(prompt);
    };

    const suggestedPrompts = activeResume
        ? [
              "What job roles best match my skills and experience?",
              "How can I improve my project descriptions to be more impactful?",
              "What typical technical interview questions should I prepare for?",
              "Which high-paying skills should I learn next to advance my career?",
          ]
        : [
              "What are the most in-demand skills for a full-stack engineer in 2025?",
              "How should I structure my resume bullets using the STAR/XYZ method?",
              "What typical technical interview questions should I prepare for?",
              "Can you give me tips for negotiating a tech job offer?",
          ];

    return (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl flex flex-col h-[740px] overflow-hidden backdrop-blur-sm">
            {/* Chat Header */}
            <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            AI Career Coach & Interview Mentor
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                    chatMode === "fast"
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                }`}
                            >
                                {chatMode === "fast" ? "⚡ FastAI Mode" : "🧠 Deep Think Mode"}
                            </span>
                        </h3>
                        {activeResume ? (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                Resume Context: <span className="text-slate-200 font-medium">{activeResume.fileName}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>General Mode • Upload a resume anytime for personalized insights</span>
                            </p>
                        )}
                    </div>
                </div>

                {chatMessages.length > 0 && (
                    <button
                        onClick={() => clearChatHistory(activeResume?._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-colors cursor-pointer"
                        title="Clear conversation"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear Chat</span>
                    </button>
                )}
            </div>

            {/* AI Model Selector Buttons: FastAI vs Deep Think */}
            <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Model:</span>
                    <div className="inline-flex p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                        {/* Option 1: FastAI */}
                        <button
                            type="button"
                            onClick={() => setChatMode("fast")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                chatMode === "fast"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                            }`}
                            title="Fast response without vector embedding (direct resume context)"
                        >
                            <Zap className={`w-3.5 h-3.5 ${chatMode === "fast" ? "text-amber-400 fill-amber-400/20" : ""}`} />
                            <span>FastAI</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 font-mono hidden sm:inline">
                                Direct • Fast
                            </span>
                        </button>

                        {/* Option 2: Deep Think */}
                        <button
                            type="button"
                            onClick={() => setChatMode("deep")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                chatMode === "deep"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                            }`}
                            title="Precise and deep answer with LangChain vector embeddings"
                        >
                            <Brain className={`w-3.5 h-3.5 ${chatMode === "deep" ? "text-purple-400" : ""}`} />
                            <span>Deep Think</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300/90 font-mono hidden sm:inline">
                                Vector RAG • Deep
                            </span>
                        </button>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    {chatMode === "fast" ? (
                        <div className="flex items-center gap-1.5 text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span><strong>FastAI:</strong> Fast response without vector embedding • Full uncut answer</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-purple-300/90 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                            <Brain className="w-3 h-3 text-purple-400" />
                            <span><strong>Deep Think:</strong> Precise & deep answer with vector embedding • Full uncut answer</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-bold text-white mb-1">Ask Your AI Career Coach</h4>
                        <p className="text-xs text-slate-400 max-w-lg mb-4">
                            Choose between <strong className="text-amber-300">FastAI</strong> (ultra-fast direct response without vector embedding) or <strong className="text-purple-300">Deep Think</strong> (deep, precise answer with LangChain vector embedding). Both models provide comprehensive, detailed answers.
                        </p>

                        {/* Model Comparison Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full mb-5">
                            <button
                                type="button"
                                onClick={() => setChatMode("fast")}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    chatMode === "fast"
                                        ? "bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/5"
                                        : "bg-slate-850/60 border-slate-800 text-slate-400 hover:border-slate-700"
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-xs text-white mb-1">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <span>FastAI Engine</span>
                                    {chatMode === "fast" && <span className="text-[10px] text-amber-400 font-normal">Active</span>}
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-300">
                                    Bypasses vector embedding latency. Directly synthesizes whole resume context into a comprehensive, detailed response in seconds.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setChatMode("deep")}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    chatMode === "deep"
                                        ? "bg-purple-500/10 border-purple-500/40 text-purple-200 shadow-md shadow-purple-500/5"
                                        : "bg-slate-850/60 border-slate-800 text-slate-400 hover:border-slate-700"
                                }`}
                            >
                                <div className="flex items-center gap-2 font-bold text-xs text-white mb-1">
                                    <Brain className="w-4 h-4 text-purple-400" />
                                    <span>Deep Think Engine</span>
                                    {chatMode === "deep" && <span className="text-[10px] text-purple-400 font-normal">Active</span>}
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-300">
                                    Uses LangChain vector embeddings and semantic search. Drills deep into specific resume metrics and architectural talking points.
                                </p>
                            </button>
                        </div>

                        {/* Suggested Prompts */}
                        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestedPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestedPrompt(prompt)}
                                    className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                                >
                                    💡 {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    chatMessages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-br-sm"
                                        : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-sm shadow-md whitespace-pre-wrap"
                                }`}
                            >
                                {msg.role === "assistant" && (
                                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/50">
                                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                                            AI Career Coach
                                        </span>
                                        {msg.mode && (
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                                                    msg.mode === "fast" || msg.mode === "fastAi"
                                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                                        : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                                }`}
                                            >
                                                {msg.mode === "fast" || msg.mode === "fastAi" ? (
                                                    <>
                                                        <Zap className="w-2.5 h-2.5" />
                                                        FastAI
                                                    </>
                                                ) : (
                                                    <>
                                                        <Brain className="w-2.5 h-2.5" />
                                                        Deep Think
                                                    </>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {msg.content}
                                </div>

                                {/* Vector sources preview */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                                        <button
                                            onClick={() => setOpenSourcesIdx(openSourcesIdx === index ? null : index)}
                                            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                                        >
                                            <span>Referenced Resume Context ({msg.sources.length} sources)</span>
                                            {openSourcesIdx === index ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>

                                        {openSourcesIdx === index && (
                                            <div className="mt-2 space-y-1.5">
                                                {msg.sources.map((src, sIdx) => (
                                                    <div key={sIdx} className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono">
                                                        {src.slice(0, 250)}...
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isChatLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-bl-sm p-4 text-xs text-slate-300 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            {chatMode === "fast" ? (
                                <span><strong>FastAI:</strong> Generating rapid full-length response directly from resume context...</span>
                            ) : (
                                <span><strong>Deep Think:</strong> Retrieving LangChain vector embeddings & conducting deep reasoning...</span>
                            )}
                        </div>
                    </div>
                )}

                {chatError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                        {chatError}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
                onSubmit={handleSend}
                className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        chatMode === "fast"
                            ? "Ask FastAI (ultra-fast direct response without vector embedding)..."
                            : "Ask Deep Think (deep analytical answer with LangChain vector embeddings)..."
                    }
                    disabled={isChatLoading}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isChatLoading}
                    className={`px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        chatMode === "fast"
                            ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30"
                    }`}
                >
                    {chatMode === "fast" ? <Zap className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                        {chatMode === "fast" ? "Ask FastAI" : "Ask Deep Think"}
                    </span>
                </button>
            </form>
        </div>
    );
};

export default CareerCoachChat;
