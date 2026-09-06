import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import Navbar from "../components/Navbar";
import ResumeBlockEditor from "../components/ResumeBlockEditor";
import ResumePaperDocument from "../components/ResumePaperDocument";
import { exportResumeToPdf, printResume } from "../utils/pdfExport";
import {
    Sparkles,
    Download,
    Save,
    Trash2,
    Plus,
    CheckCircle2,
    Clock,
    Target,
    FileText,
    BrainCircuit,
    ChevronRight,
    TrendingUp,
    AlertCircle,
    Printer,
    FileCode,
    RefreshCw,
    FolderKanban,
} from "lucide-react";

export const ResumeBuilderPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const resumeIdParam = searchParams.get("id");

    const {
        resumes,
        builderResumes,
        activeBuilderResume,
        fetchBuilderResumes,
        generateAiResume,
        createBuilderResume,
        updateBuilderResume,
        deleteBuilderResume,
        analyzeBuilderResume,
        setActiveBuilderResume,
        isBuilderLoading,
        isAnalyzingBuilder,
    } = useAppStore();

    // Editor state
    const [resumeTitle, setResumeTitle] = useState("My AI Resume");
    const [targetRole, setTargetRole] = useState("Full Stack Developer");
    const [editorContent, setEditorContent] = useState("");
    const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
    const [showAiModal, setShowAiModal] = useState(false);
    const [showScoreDrawer, setShowScoreDrawer] = useState(true);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
    const [activeViewTab, setActiveViewTab] = useState<"editor" | "preview">("editor");
    const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

    // AI Generator Modal state
    const [selectedSourceResumeId, setSelectedSourceResumeId] = useState<string>("");
    const [aiTargetRole, setAiTargetRole] = useState("Full Stack Developer");
    const [aiInstructions, setAiInstructions] = useState("");
    const [aiResumeTitle, setAiResumeTitle] = useState("");

    const saveTimeoutRef = useRef<any>(null);

    // On mount, fetch builder resumes
    useEffect(() => {
        fetchBuilderResumes();
    }, [fetchBuilderResumes]);

    // Handle resume selection via query parameter or default
    useEffect(() => {
        if (resumeIdParam && builderResumes.length > 0) {
            const found = builderResumes.find((r) => r._id === resumeIdParam);
            if (found) {
                setActiveBuilderResume(found);
                setResumeTitle(found.title);
                setTargetRole(found.targetRole || "Full Stack Developer");
                setEditorContent(found.content);
                setSaveStatus("saved");
            }
        } else if (!resumeIdParam && builderResumes.length > 0 && !activeBuilderResume) {
            const first = builderResumes[0];
            setActiveBuilderResume(first);
            setResumeTitle(first.title);
            setTargetRole(first.targetRole || "Full Stack Developer");
            setEditorContent(first.content);
            setSearchParams({ id: first._id });
        }
    }, [resumeIdParam, builderResumes, activeBuilderResume, setActiveBuilderResume, setSearchParams]);

    // Set default base resume for AI modal
    useEffect(() => {
        if (resumes.length > 0 && !selectedSourceResumeId) {
            setSelectedSourceResumeId(resumes[0]._id);
        }
    }, [resumes, selectedSourceResumeId]);

    // Handle Content Changes from BlockNote
    const handleContentChange = (markdown: string) => {
        setEditorContent(markdown);
        setSaveStatus("unsaved");

        // Debounced auto-save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            if (activeBuilderResume) {
                handleSave(markdown);
            }
        }, 2000);
    };

    // Save Resume
    const handleSave = async (contentToSave?: string) => {
        const text = contentToSave !== undefined ? contentToSave : editorContent;
        if (!activeBuilderResume) {
            // Create new
            setSaveStatus("saving");
            const created = await createBuilderResume({
                title: resumeTitle,
                targetRole,
                content: text,
            });
            if (created) {
                setSaveStatus("saved");
                setSearchParams({ id: created._id });
            }
            return;
        }

        setSaveStatus("saving");
        const success = await updateBuilderResume(activeBuilderResume._id, {
            title: resumeTitle,
            targetRole,
            content: text,
        });
        if (success) {
            setSaveStatus("saved");
        }
    };

    // Trigger AI Generation
    const handleGenerateAiResume = async (e: React.FormEvent) => {
        e.preventDefault();
        const role = aiTargetRole.trim() || targetRole || "Full Stack Developer";
        const title = aiResumeTitle.trim() || `${role} Resume (AI Generated)`;

        const generated = await generateAiResume({
            resumeId: selectedSourceResumeId || undefined,
            targetRole: role,
            title,
            customInstructions: aiInstructions.trim() || undefined,
        });

        if (generated) {
            setShowAiModal(false);
            setResumeTitle(generated.title);
            setTargetRole(generated.targetRole);
            setEditorContent(generated.content);
            setSaveStatus("saved");
            setSearchParams({ id: generated._id });
        }
    };

    // Trigger AI ATS Analysis on current resume
    const handleAnalyzeWithAi = async () => {
        if (!activeBuilderResume) {
            await handleSave();
        }
        const currentId = activeBuilderResume?._id;
        if (!currentId) return;

        await analyzeBuilderResume(currentId, { content: editorContent });
    };

    // Delete current resume
    const handleDelete = async () => {
        if (!activeBuilderResume) return;
        if (window.confirm(`Are you sure you want to delete "${activeBuilderResume.title}"?`)) {
            const success = await deleteBuilderResume(activeBuilderResume._id);
            if (success) {
                if (builderResumes.length > 1) {
                    const next = builderResumes.find((r) => r._id !== activeBuilderResume._id);
                    if (next) {
                        setActiveBuilderResume(next);
                        setSearchParams({ id: next._id });
                    }
                } else {
                    setActiveBuilderResume(null);
                    setEditorContent("");
                    setResumeTitle("My AI Resume");
                    setSearchParams({});
                }
            }
        }
    };

    // Create New Blank Resume
    const handleNewBlankResume = async () => {
        const defaultText = `# Your Name\nyour.email@example.com | (555) 123-4567 | San Francisco, CA\n\n## Professional Summary\nExperienced software engineer specialized in building scalable full-stack applications.\n\n## Technical Core Competencies\n- **Languages**: TypeScript, JavaScript, Python\n- **Frameworks**: React, Node.js, Express, Tailwind CSS\n- **Databases & Cloud**: MongoDB, PostgreSQL, AWS, Docker\n\n## Professional Work Experience\n### Software Engineer | Example Tech\n*2022 – Present*\n- Developed responsive frontend applications in React.\n- Implemented REST APIs in Node.js and Express.\n\n## Education\n### BS in Computer Science\nUniversity | 2018 – 2022\n`;
        const created = await createBuilderResume({
            title: "Untitled Resume",
            targetRole: "Software Engineer",
            content: defaultText,
        });
        if (created) {
            setResumeTitle(created.title);
            setTargetRole(created.targetRole);
            setEditorContent(created.content);
            setSaveStatus("saved");
            setSearchParams({ id: created._id });
        }
    };

    // Export / Download as PDF
    const handleDownloadPdf = async () => {
        if (!editorContent.trim() || isDownloadingPdf) return;
        setIsDownloadingPdf(true);
        setDownloadNotice("Preparing high-resolution PDF...");

        const success = await exportResumeToPdf({
            elementId: "resume-paper-document",
            fileName: resumeTitle || "Resume",
            onSuccess: () => {
                setDownloadNotice("PDF downloaded successfully!");
                setTimeout(() => setDownloadNotice(null), 4000);
            },
            onError: (err) => {
                console.warn("Client PDF generation fallback to print:", err);
                setDownloadNotice("Opening print dialog. Select 'Save as PDF' to save.");
                setTimeout(() => {
                    printResume();
                    setDownloadNotice(null);
                }, 500);
            },
        });

        if (!success) {
            printResume();
        }

        setIsDownloadingPdf(false);
    };

    const currentAnalysis = activeBuilderResume?.atsAnalysis;

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Top Action Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                type="text"
                                value={resumeTitle}
                                onChange={(e) => {
                                    setResumeTitle(e.target.value);
                                    setSaveStatus("unsaved");
                                }}
                                placeholder="Resume Title"
                                className="text-xl sm:text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5 rounded"
                            />
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                                    saveStatus === "saved"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : saveStatus === "saving"
                                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                            >
                                {saveStatus === "saved" ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3" /> Saved
                                    </>
                                ) : saveStatus === "saving" ? (
                                    <>
                                        <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Unsaved Changes"
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-indigo-400" />
                                Target Role:
                            </span>
                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => {
                                    setTargetRole(e.target.value);
                                    setSaveStatus("unsaved");
                                }}
                                placeholder="e.g. Full Stack Developer"
                                className="bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Generate AI Resume Button */}
                        <button
                            type="button"
                            onClick={() => setShowAiModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Create AI Resume</span>
                        </button>

                        {/* Save Button */}
                        <button
                            type="button"
                            onClick={() => handleSave()}
                            disabled={saveStatus === "saving"}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                        </button>

                        {/* AI ATS Analysis Button */}
                        <button
                            type="button"
                            onClick={handleAnalyzeWithAi}
                            disabled={isAnalyzingBuilder || !editorContent.trim()}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isAnalyzingBuilder ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Scoring ATS...</span>
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="w-4 h-4" />
                                    <span>Analyze with AI</span>
                                </>
                            )}
                        </button>

                        {/* Download PDF Button */}
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf || !editorContent.trim()}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
                            title="Download PDF directly to your device"
                        >
                            {isDownloadingPdf ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Download PDF</span>
                                </>
                            )}
                        </button>

                        {/* Print / Save as PDF Fallback Button */}
                        <button
                            type="button"
                            onClick={printResume}
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                            title="Print or Save as PDF via system print dialog"
                        >
                            <Printer className="w-4 h-4" />
                        </button>

                        {/* Delete Resume */}
                        {activeBuilderResume && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors cursor-pointer"
                                title="Delete Resume"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Editor & Insights Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left: Saved Resumes Vault Quick Switcher (2 Cols on large screens) */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <FolderKanban className="w-4 h-4 text-indigo-400" />
                                Your Resumes ({builderResumes.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleNewBlankResume}
                                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Draft
                            </button>
                        </div>

                        {/* Resume List */}
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {builderResumes.map((r) => (
                                <button
                                    key={r._id}
                                    type="button"
                                    onClick={() => {
                                        setActiveBuilderResume(r);
                                        setResumeTitle(r.title);
                                        setTargetRole(r.targetRole || "Full Stack Developer");
                                        setEditorContent(r.content);
                                        setSaveStatus("saved");
                                        setSearchParams({ id: r._id });
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                        activeBuilderResume?._id === r._id
                                            ? "bg-indigo-600/15 border-indigo-500/80 shadow-sm"
                                            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <h4 className="text-xs font-bold text-white truncate">{r.title}</h4>
                                        {r.atsAnalysis?.atsScore !== undefined && (
                                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                {r.atsAnalysis.atsScore}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.targetRole}</p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                                        <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
                                        <span className="capitalize">{r.status}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* ATS Scorecard Toggle or Widget */}
                        {currentAnalysis && (
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        ATS Scorecard
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {currentAnalysis.atsGrade}
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-1.5 my-2">
                                    <span className="text-3xl font-black text-white">
                                        {currentAnalysis.atsScore}
                                    </span>
                                    <span className="text-xs text-slate-500 font-semibold">/ 100</span>
                                </div>

                                {/* Category Progress Bars */}
                                <div className="space-y-2 text-[11px] text-slate-300 mt-3 pt-3 border-t border-slate-800">
                                    <div>
                                        <div className="flex justify-between mb-0.5 text-[10px]">
                                            <span className="text-slate-400">Keywords</span>
                                            <span>{currentAnalysis.categoryScores?.keywordOptimization || 75}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                            <div
                                                className="bg-indigo-500 h-1.5 rounded-full"
                                                style={{ width: `${currentAnalysis.categoryScores?.keywordOptimization || 75}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-0.5 text-[10px]">
                                            <span className="text-slate-400">Experience Impact</span>
                                            <span>{currentAnalysis.categoryScores?.experienceImpact || 70}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                            <div
                                                className="bg-emerald-500 h-1.5 rounded-full"
                                                style={{ width: `${currentAnalysis.categoryScores?.experienceImpact || 70}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-0.5 text-[10px]">
                                            <span className="text-slate-400">Skills Relevance</span>
                                            <span>{currentAnalysis.categoryScores?.skillsRelevance || 80}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                                            <div
                                                className="bg-teal-500 h-1.5 rounded-full"
                                                style={{ width: `${currentAnalysis.categoryScores?.skillsRelevance || 80}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations Preview */}
                                {currentAnalysis.actionableRecommendations && currentAnalysis.actionableRecommendations.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                                        <span className="text-[11px] font-bold text-indigo-300">Key Recommendation:</span>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                            {currentAnalysis.actionableRecommendations[0]}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Center & Right: BlockNote Editor & PDF Preview Container (9 Cols) */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* View Mode Switcher (Editor vs Document Preview) & Status Notice */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-md">
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setActiveViewTab("editor")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        activeViewTab === "editor"
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Notion Editor</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveViewTab("preview")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        activeViewTab === "preview"
                                            ? "bg-teal-600 text-white shadow-sm"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>A4 Document Preview</span>
                                </button>
                            </div>

                            {downloadNotice && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-medium animate-pulse-subtle">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{downloadNotice}</span>
                                </div>
                            )}
                        </div>

                        {/* Visual Display */}
                        {activeViewTab === "editor" ? (
                            <div>
                                <ResumeBlockEditor
                                    content={editorContent}
                                    targetRole={targetRole}
                                    onChange={handleContentChange}
                                />
                                {/* Clean printable document sheet mounted for PDF export */}
                                <div
                                    style={{
                                        position: "fixed",
                                        left: "-9999px",
                                        top: 0,
                                        width: "800px",
                                        pointerEvents: "none",
                                    }}
                                    aria-hidden="true"
                                >
                                    <ResumePaperDocument
                                        content={editorContent}
                                        id="resume-paper-document"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* A4 Document Preview */
                            <div className="space-y-4">
                                <div className="p-4 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-x-auto">
                                    <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Printer className="w-4 h-4 text-teal-400" />
                                            Live Formatted Resume (Ready for ATS & PDF)
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleDownloadPdf}
                                                disabled={isDownloadingPdf}
                                                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Download PDF</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={printResume}
                                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Print</span>
                                            </button>
                                        </div>
                                    </div>

                                    <ResumePaperDocument
                                        content={editorContent}
                                        id="resume-paper-document"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* AI Resume Generator Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-base font-bold text-white">Create AI Resume from Old Resume</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAiModal(false)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleGenerateAiResume} className="space-y-4">
                            {/* Choose Old Resume */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Select Base Resume Source
                                </label>
                                {resumes.length > 0 ? (
                                    <select
                                        value={selectedSourceResumeId}
                                        onChange={(e) => setSelectedSourceResumeId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                    >
                                        {resumes.map((r) => (
                                            <option key={r._id} value={r._id}>
                                                {r.fileName} (ATS Score: {r.analysis?.atsScore || "--"})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                                        No uploaded PDF resumes found. AI will generate an exemplary tailored resume from your profile.
                                    </div>
                                )}
                            </div>

                            {/* Target Role */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Target Position / Role
                                </label>
                                <input
                                    type="text"
                                    value={aiTargetRole}
                                    onChange={(e) => setAiTargetRole(e.target.value)}
                                    placeholder="e.g. Senior Full Stack Engineer, AI Architect"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Resume Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    New Resume Title (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={aiResumeTitle}
                                    onChange={(e) => setAiResumeTitle(e.target.value)}
                                    placeholder="e.g. 2026 Tech Lead Resume"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Custom Instructions */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Custom AI Focus / Instructions (Optional)
                                </label>
                                <textarea
                                    value={aiInstructions}
                                    onChange={(e) => setAiInstructions(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. Emphasize microservices scaling, AWS cloud cost reduction by 30%, and leadership of distributed teams."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAiModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isBuilderLoading}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isBuilderLoading ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Crafting with AI...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Generate AI Resume</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeBuilderPage;