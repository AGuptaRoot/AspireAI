import React from "react";

interface AtsScoreCircleProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    grade?: string;
}

export const AtsScoreCircle: React.FC<AtsScoreCircleProps> = ({
    score,
    size = 140,
    strokeWidth = 10,
    grade,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedScore = Math.min(100, Math.max(0, score || 0));
    const offset = circumference - (clampedScore / 100) * circumference;

    let colorClass = "text-emerald-500";
    let bgGlow = "shadow-emerald-500/20";
    let gradeBadgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    if (clampedScore >= 80) {
        colorClass = "text-emerald-400";
        bgGlow = "shadow-emerald-500/30";
        gradeBadgeBg = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    } else if (clampedScore >= 65) {
        colorClass = "text-indigo-400";
        bgGlow = "shadow-indigo-500/30";
        gradeBadgeBg = "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
    } else if (clampedScore >= 50) {
        colorClass = "text-amber-400";
        bgGlow = "shadow-amber-500/30";
        gradeBadgeBg = "bg-amber-500/10 text-amber-300 border-amber-500/30";
    } else {
        colorClass = "text-rose-400";
        bgGlow = "shadow-rose-500/30";
        gradeBadgeBg = "bg-rose-500/10 text-rose-300 border-rose-500/30";
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            <div className={`relative flex items-center justify-center rounded-full ${bgGlow} shadow-xl`}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-slate-800"
                        fill="transparent"
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={`${colorClass} transition-all duration-1000 ease-out`}
                        fill="transparent"
                    />
                </svg>

                {/* Center score */}
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold tracking-tight text-white">{clampedScore}</span>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">/ 100 ATS</span>
                </div>
            </div>

            {grade && (
                <span className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${gradeBadgeBg}`}>
                    {grade}
                </span>
            )}
        </div>
    );
};

export default AtsScoreCircle;
