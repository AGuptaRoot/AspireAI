import React, { useState, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export const ResumeUploader: React.FC = () => {
    const { uploadResume, isUploading, resumeError } = useAppStore();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndSetFile = (file: File) => {
        setLocalError(null);
        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setLocalError("Please select a valid PDF document (.pdf)");
            setSelectedFile(null);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setLocalError("File size exceeds 5MB limit. Please upload a smaller PDF.");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const success = await uploadResume(selectedFile);
        if (success) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
            });
            setSelectedFile(null);
        }
    };

    return (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-indigo-400" />
                        Upload Your Resume
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        PDF format up to 5MB. AI will parse, chunk, evaluate ATS compatibility, and index for career advice.
                    </p>
                </div>
            </div>

            {/* Drag & Drop Box */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    dragActive
                        ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                        : "border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800/50"
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleChange}
                    className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                        <FileText className="w-7 h-7" />
                    </div>

                    {selectedFile ? (
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                {selectedFile.name}
                            </div>
                            <span className="text-xs text-slate-400">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-200">
                                <span className="text-indigo-400 font-semibold">Click to browse</span> or drag & drop your resume PDF
                            </p>
                            <p className="text-xs text-slate-500">Supports PDF format (Max 5MB)</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {(localError || resumeError) && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{localError || resumeError}</span>
                </div>
            )}

            {/* Upload Button */}
            {selectedFile && (
                <div className="mt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                        }}
                        className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                        }}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Parsing & Analyzing with AI...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4" />
                                Scan & Analyze Resume
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResumeUploader;
