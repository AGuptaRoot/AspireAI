import React, { useEffect, useRef, useState, useMemo } from "react";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { AIExtension, AIMenuController } from "@blocknote/xl-ai";
import "@blocknote/xl-ai/style.css";
import { Sparkles, Code, Type, Wand2, Zap, Target, CheckCircle, RefreshCw, MessageSquarePlus } from "lucide-react";
import { BlockNoteAiResumeTransport } from "../utils/aiTransport";
import { api } from "../services/api";

interface ResumeBlockEditorProps {
    content: string;
    targetRole?: string;
    onChange?: (markdown: string, blocks: any[]) => void;
    editable?: boolean;
    className?: string;
}

export const ResumeBlockEditor: React.FC<ResumeBlockEditorProps> = ({
    content,
    targetRole = "Full Stack Developer",
    onChange,
    editable = true,
    className = "",
}) => {
    const aiTransport = useMemo(() => new BlockNoteAiResumeTransport(targetRole), [targetRole]);

    const editor = useCreateBlockNote({
        extensions: [
            AIExtension({
                transport: aiTransport,
            }),
        ],
    });

    const lastMarkdownRef = useRef<string>("");
    const isInitialLoadRef = useRef<boolean>(true);
    const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
    const [rawText, setRawText] = useState<string>(content);
    const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
    const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState<string>("");
    const [showCustomPromptInput, setShowCustomPromptInput] = useState<boolean>(false);

    // Keep transport updated with latest target role
    useEffect(() => {
        aiTransport.setTargetRole(targetRole);
    }, [targetRole, aiTransport]);

    // Initial content load into BlockNote
    useEffect(() => {
        if (!editor) return;

        // If content is new or initial load
        if (isInitialLoadRef.current || (content && content !== lastMarkdownRef.current)) {
            isInitialLoadRef.current = false;
            lastMarkdownRef.current = content;
            setRawText(content);

            if (content.trim()) {
                try {
                    const parsed = editor.tryParseMarkdownToBlocks(content);
                    const updateEditorBlocks = (blocks: any[]) => {
                        if (blocks && blocks.length > 0) {
                            editor.replaceBlocks(editor.document, blocks);
                        }
                    };

                    // Handle both Promise and synchronous return types across BlockNote versions
                    if (parsed && typeof (parsed as any).then === "function") {
                        (parsed as Promise<any>).then(updateEditorBlocks).catch((err) => {
                            console.error("Failed to parse markdown to BlockNote blocks:", err);
                        });
                    } else if (Array.isArray(parsed) && parsed.length > 0) {
                        updateEditorBlocks(parsed);
                    }
                } catch (err) {
                    console.error("Failed to parse markdown to BlockNote blocks:", err);
                }
            }
        }
    }, [content, editor]);

    // Handle user changes inside BlockNote
    const handleEditorChange = async () => {
        if (!editor) return;
        try {
            const result = editor.blocksToMarkdownLossy(editor.document);
            const markdown = (result && typeof (result as any).then === "function") ? await result : (result as string);
            lastMarkdownRef.current = markdown;
            setRawText(markdown);
            onChange?.(markdown, editor.document);
        } catch (err) {
            console.error("Error serializing BlockNote blocks to markdown:", err);
        }
    };

    // Handle raw text edit mode sync
    const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawText(val);
        lastMarkdownRef.current = val;
        onChange?.(val, editor?.document || []);
    };

    const handleSwitchToVisual = async () => {
        setViewMode("visual");
        if (editor && rawText.trim()) {
            try {
                const result = editor.tryParseMarkdownToBlocks(rawText);
                const blocks = (result && typeof (result as any).then === "function") ? await result : result;
                if (Array.isArray(blocks) && blocks.length > 0) {
                    editor.replaceBlocks(editor.document, blocks);
                }
            } catch (err) {
                console.error("Failed to parse raw markdown into blocks:", err);
            }
        }
    };

    // AI Block Assistant Execution (XYZ formula, concise, polish, or custom prompt)
    const handleExecuteAiAction = async (
        actionType: "xyz" | "concise" | "roleAlign" | "improve" | "custom",
        customInstructionText?: string
    ) => {
        if (!editor || isAiProcessing) return;

        try {
            setIsAiProcessing(true);
            setAiActionMessage("AI is analyzing and rewriting...");

            // Determine text context from selection or active cursor block
            let textToRewrite = "";
            let targetBlockId = "";

            const selection = editor.getSelection();
            if (selection && selection.blocks.length > 0) {
                const selectedBlocks = selection.blocks;
                targetBlockId = selectedBlocks[0].id;
                textToRewrite = editor.blocksToMarkdownLossy(selectedBlocks);
            } else {
                const cursor = editor.getTextCursorPosition();
                if (cursor?.block) {
                    targetBlockId = cursor.block.id;
                    textToRewrite = editor.blocksToMarkdownLossy([cursor.block]);
                }
            }

            if (!textToRewrite.trim()) {
                textToRewrite = rawText.slice(0, 500);
            }

            const res = await api.builder.aiWrite({
                prompt: customInstructionText || customPrompt,
                selectedText: textToRewrite,
                contextText: rawText.slice(0, 1000),
                targetRole,
                action: actionType,
            });

            const rewrittenText = res.data?.rewrittenText;
            if (rewrittenText && editor) {
                const parsedResult = editor.tryParseMarkdownToBlocks(rewrittenText);
                const newBlocks = (parsedResult && typeof (parsedResult as any).then === "function")
                    ? await parsedResult
                    : parsedResult;

                if (Array.isArray(newBlocks) && newBlocks.length > 0) {
                    if (targetBlockId) {
                        const existingBlock = editor.getBlock(targetBlockId);
                        if (existingBlock) {
                            editor.replaceBlocks([existingBlock], newBlocks);
                        } else {
                            editor.replaceBlocks(editor.document, newBlocks);
                        }
                    } else {
                        editor.replaceBlocks(editor.document, newBlocks);
                    }

                    // Sync updated markdown
                    const updatedMarkdown = await editor.blocksToMarkdownLossy(editor.document);
                    lastMarkdownRef.current = updatedMarkdown;
                    setRawText(updatedMarkdown);
                    onChange?.(updatedMarkdown, editor.document);
                }
            }

            setAiActionMessage(
                actionType === "xyz"
                    ? "✨ Converted using Google X-Y-Z formula!"
                    : actionType === "concise"
                    ? "⚡ Condensed with high-impact verbs!"
                    : actionType === "roleAlign"
                    ? `🚀 Tailored for ${targetRole}!`
                    : "✨ Bullet improved with AI!"
            );
            setShowCustomPromptInput(false);
            setCustomPrompt("");
            setTimeout(() => setAiActionMessage(null), 4000);
        } catch (err: any) {
            console.error("AI Action error:", err);
            setAiActionMessage("⚠️ Failed to apply AI rewrite. Please try again.");
            setTimeout(() => setAiActionMessage(null), 3000);
        } finally {
            setIsAiProcessing(false);
        }
    };

    return (
        <div className={`flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden ${className}`}>
            {/* Editor Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-slate-200">Notion-Style BlockNote Editor</span>
                    <span className="text-[10px] text-slate-500 hidden md:inline">
                        (Type &lsquo;/ai&rsquo; or &lsquo;/&rsquo; for blocks, or use AI buttons below)
                    </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                        type="button"
                        onClick={handleSwitchToVisual}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                            viewMode === "visual"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Type className="w-3 h-3" />
                        <span>Block View</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("raw")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                            viewMode === "raw"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Code className="w-3 h-3" />
                        <span>Markdown Raw</span>
                    </button>
                </div>
            </div>

            {/* AI Resume Writing Toolbar (@blocknote/xl-ai feature) */}
            <div className="px-4 py-2 bg-indigo-950/20 border-b border-indigo-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1 mr-1">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        AI Writer:
                    </span>

                    {/* Google XYZ Formula */}
                    <button
                        type="button"
                        onClick={() => handleExecuteAiAction("xyz")}
                        disabled={isAiProcessing || !editable}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 text-[11px] font-semibold"
                        title="Rewrite current bullet point using Google X-Y-Z formula (Accomplished X as measured by Y doing Z)"
                    >
                        <Target className="w-3 h-3 text-indigo-300" />
                        <span>Google X-Y-Z Metrics</span>
                    </button>

                    {/* Make Concise */}
                    <button
                        type="button"
                        onClick={() => handleExecuteAiAction("concise")}
                        disabled={isAiProcessing || !editable}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600/15 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30 transition-all cursor-pointer disabled:opacity-50 text-[11px] font-semibold"
                        title="Make phrasing punchy and remove fluff"
                    >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Make Concise</span>
                    </button>

                    {/* Align with Role */}
                    <button
                        type="button"
                        onClick={() => handleExecuteAiAction("roleAlign")}
                        disabled={isAiProcessing || !editable}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 text-[11px] font-semibold"
                        title={`Align technical keywords with ${targetRole}`}
                    >
                        <Sparkles className="w-3 h-3 text-emerald-300" />
                        <span>Role Align</span>
                    </button>

                    {/* Custom Prompt Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowCustomPromptInput(!showCustomPromptInput)}
                        disabled={isAiProcessing || !editable}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer text-[11px] font-semibold"
                    >
                        <MessageSquarePlus className="w-3 h-3" />
                        <span>Custom Prompt</span>
                    </button>
                </div>

                {/* Status or loading notice */}
                {isAiProcessing ? (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-300 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Rewriting block...</span>
                    </div>
                ) : aiActionMessage ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{aiActionMessage}</span>
                    </div>
                ) : null}
            </div>

            {/* Custom AI Prompt Input Bar */}
            {showCustomPromptInput && (
                <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 animate-fade-in">
                    <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && customPrompt.trim()) {
                                handleExecuteAiAction("custom", customPrompt);
                            }
                        }}
                        placeholder={`e.g. Add AWS cloud cost reduction metrics, or make this bullet sound like a Lead Engineer...`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={() => handleExecuteAiAction("custom", customPrompt)}
                        disabled={!customPrompt.trim() || isAiProcessing}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                        Apply AI
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCustomPromptInput(false)}
                        className="text-xs text-slate-400 hover:text-white px-2 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Editor Body */}
            <div className="p-4 sm:p-6 min-h-[520px] bg-slate-950/40 text-slate-100">
                {viewMode === "visual" ? (
                    <div className="blocknote-resume-wrapper prose prose-invert max-w-none">
                        <BlockNoteView
                            editor={editor}
                            editable={editable}
                            theme="dark"
                            onChange={handleEditorChange}
                        >
                            <AIMenuController />
                        </BlockNoteView>
                    </div>
                ) : (
                    <textarea
                        value={rawText}
                        onChange={handleRawTextChange}
                        disabled={!editable}
                        placeholder="# Write or paste your resume markdown here..."
                        className="w-full min-h-[500px] font-mono text-xs leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                    />
                )}
            </div>
        </div>
    );
};

export default ResumeBlockEditor;