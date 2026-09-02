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
} from "lucide-react";

export const CareerCoachChat: React.FC = () => {
    const {
        activeResume,
        chatMessages,
        isChatLoading,
        chatError,
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

    const suggestedPrompts = [
        "What job roles best match my skills and experience?",
        "How can I improve my project descriptions to be more impactful?",
        "What typical technical interview questions should I prepare for?",
        "Which high-paying skills should I learn next to advance my career?",
    ];

    if (!activeResume) {
        return (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3">
                    <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Upload a Resume to Start Chatting</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                    The AI Career Coach uses Vector Embeddings to semantically read your resume and give tailored career guidance.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl flex flex-col h-[700px] overflow-hidden backdrop-blur-sm">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            AI Career Coach & Interview Mentor
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                Vector RAG Active
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            Context: <span className="text-slate-200 font-medium">{activeResume.fileName}</span>
                        </p>
                    </div>
                </div>

                {chatMessages.length > 0 && (
                    <button
                        onClick={() => clearChatHistory(activeResume._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-colors cursor-pointer"
                        title="Clear conversation"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear Chat</span>
                    </button>
                )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-bold text-white mb-1">Ask Your AI Career Coach</h4>
                        <p className="text-xs text-slate-400 max-w-md mb-6">
                            I've indexed your resume using semantic embeddings. Ask me about job matches, interview prep, or resume bullet optimizations!
                        </p>

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
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
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
                                            <span>Referenced Resume Context ({msg.sources.length} chunks)</span>
                                            {openSourcesIdx === index ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>

                                        {openSourcesIdx === index && (
                                            <div className="mt-2 space-y-1.5">
                                                {msg.sources.map((src, sIdx) => (
                                                    <div key={sIdx} className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono">
                                                        {src.slice(0, 200)}...
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0">
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
                            <span>Retrieving vector embeddings and analyzing career context...</span>
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
                    placeholder="Ask about job roles, interview tips, or resume improvements..."
                    disabled={isChatLoading}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isChatLoading}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Ask AI</span>
                </button>
            </form>
        </div>
    );
};

export default CareerCoachChat;
