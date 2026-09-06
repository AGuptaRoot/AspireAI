import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import Navbar from "../components/Navbar";
import {
    User as UserIcon,
    Briefcase,
    Mail,
    Phone,
    MapPin,
    Globe,
    Sparkles,
    Check,
    AlertCircle,
    Loader2,
    Lock,
    Plus,
    X,
    CheckCircle2,
    AtSign,
    Target,
    ShieldCheck,
    ArrowLeft,
    Save,
    RotateCcw,
    ExternalLink,
} from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";

const COMMON_SKILLS = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Next.js",
    "Express.js",
    "MongoDB",
    "PostgreSQL",
    "Tailwind CSS",
    "Docker",
    "AWS",
    "GraphQL",
    "REST APIs",
    "Git & GitHub",
    "LangChain",
    "OpenAI API",
    "System Design",
];

export const ProfilePage: React.FC = () => {
    const { user, updateProfile, authLoading } = useAppStore();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [profession, setProfession] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Sync form values from store user
    const syncUserFields = () => {
        if (user) {
            setUsername(user.username || "");
            setFullName(user.fullName || "");
            setProfession(user.profession || "");
            setTargetRole(user.targetRole || "");
            setPhone(user.phone || "");
            setLocation(user.location || "");
            setBio(user.bio || "");
            setLinkedinUrl(user.linkedinUrl || "");
            setGithubUrl(user.githubUrl || "");
            setPortfolioUrl(user.portfolioUrl || "");
            setSkills(user.skills && Array.isArray(user.skills) ? [...user.skills] : []);
        }
    };

    useEffect(() => {
        syncUserFields();
    }, [user]);

    // Calculate profile completeness
    const completenessCriteria = useMemo(() => {
        return [
            { label: "Full Name", done: Boolean(fullName.trim()) },
            { label: "Username Handle", done: Boolean(username.trim()) },
            { label: "Current Profession", done: Boolean(profession.trim()) },
            { label: "Target Dream Role", done: Boolean(targetRole.trim()) },
            { label: "Phone Number", done: Boolean(phone.trim()) },
            { label: "Location", done: Boolean(location.trim()) },
            { label: "Professional Bio", done: Boolean(bio.trim()) },
            { label: "LinkedIn Profile", done: Boolean(linkedinUrl.trim()) },
            { label: "GitHub Profile", done: Boolean(githubUrl.trim()) },
            { label: "Portfolio URL", done: Boolean(portfolioUrl.trim()) },
            { label: "Technical Skills", done: skills.length > 0 },
        ];
    }, [fullName, username, profession, targetRole, phone, location, bio, linkedinUrl, githubUrl, portfolioUrl, skills]);

    const completenessPercent = useMemo(() => {
        const completed = completenessCriteria.filter((c) => c.done).length;
        return Math.round((completed / completenessCriteria.length) * 100);
    }, [completenessCriteria]);

    const handleAddSkill = (skillToAdd?: string) => {
        const value = (skillToAdd || skillInput).trim();
        if (!value) return;
        if (!skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
            setSkills([...skills, value]);
        }
        if (!skillToAdd) {
            setSkillInput("");
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter((s) => s !== skillToRemove));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!username.trim() || username.trim().length < 3) {
            setErrorMessage("Username must be at least 3 characters long");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (!profession.trim() || profession.trim().length < 2) {
            setErrorMessage("Current profession must be at least 2 characters long");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const success = await updateProfile({
            username: username.trim(),
            fullName: fullName.trim(),
            profession: profession.trim(),
            targetRole: targetRole.trim(),
            phone: phone.trim(),
            location: location.trim(),
            bio: bio.trim(),
            linkedinUrl: linkedinUrl.trim(),
            githubUrl: githubUrl.trim(),
            portfolioUrl: portfolioUrl.trim(),
            skills,
        });

        if (success) {
            setSuccessMessage("Your profile has been saved and synced across AspireAI!");
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3500);
        } else {
            const storeError = useAppStore.getState().authError;
            setErrorMessage(storeError || "Failed to update profile. Please try again.");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const userDisplayName = fullName.trim() || username.trim() || "Candidate";
    const userInitials = (fullName.trim() || username.trim() || "U").slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Navigation & Breadcrumb */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                            <Link to="/dashboard" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to Dashboard
                            </Link>
                            <span>/</span>
                            <span className="text-slate-200">Candidate Profile</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Edit Profile & Career Settings
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Your details are used by the AI Resume Builder, ATS Evaluator, and AI Technical Interviewer.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={syncUserFields}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                            title="Reset unsaved changes"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={authLoading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {authLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Profile</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {errorMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs sm:text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span className="font-semibold">{errorMessage}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                {/* 2-Column Responsive Layout */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card & Completeness (1 col) */}
                    <div className="space-y-6">
                        {/* Identity Card */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl text-center relative overflow-hidden">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/25 mx-auto mb-4 border-2 border-white/10">
                                {userInitials}
                            </div>

                            <h2 className="text-xl font-black text-white tracking-tight">
                                {userDisplayName}
                            </h2>

                            <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                                @{username || "username"}
                            </p>

                            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                                    {profession || "Candidate"}
                                </span>
                                {targetRole && (
                                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                                        Aiming: {targetRole}
                                    </span>
                                )}
                            </div>

                            {location && (
                                <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                    {location}
                                </p>
                            )}
                        </div>

                        {/* Profile Completeness Checklist */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                    Profile Strength
                                </span>
                                <span className="text-xs font-black text-indigo-400">
                                    {completenessPercent}% Complete
                                </span>
                            </div>

                            <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800 mb-4">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${completenessPercent}%` }}
                                />
                            </div>

                            <div className="space-y-2 text-xs">
                                {completenessCriteria.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between text-slate-400">
                                        <span>{item.label}</span>
                                        {item.done ? (
                                            <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Done
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-[11px] italic">Missing</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Account Details Box */}
                        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-3">
                            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                                Account Security
                            </h4>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                <span>OTP & JWT Authenticated</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Full Form Fields (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Section 1: Basic Information */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Personal Identity</h3>
                                    <p className="text-[11px] text-slate-400">Your name, handle, and professional roles</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Alex Johnson"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Displayed on your exported resumes and header</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Username Handle <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <AtSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            minLength={3}
                                            maxLength={50}
                                            placeholder="alexdev"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">Unique handle across AspireAI</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Current Profession <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={profession}
                                            onChange={(e) => setProfession(e.target.value)}
                                            required
                                            placeholder="e.g. Full Stack Developer"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Target Dream Role
                                    </label>
                                    <div className="relative">
                                        <Target className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            placeholder="e.g. Lead AI Systems Architect"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">Directs AI interview questions and resume keyword targeting</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact & Location */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Contact & Location</h3>
                                    <p className="text-[11px] text-slate-400">Reachability for interview notifications and applications</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 (555) 019-2834"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Location / City, Country
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="San Francisco, CA or Remote"
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                        Account Email (Read-Only)
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-400 cursor-not-allowed select-none"
                                        />
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            <Lock className="w-3 h-3" />
                                            <span>Locked for Security</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Professional Links */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Online Presence & Portfolios</h3>
                                    <p className="text-[11px] text-slate-400">Showcase your public profiles and code repositories</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                        <FaLinkedin className="text-blue-400 w-4 h-4" />
                                        LinkedIn Profile URL
                                    </label>
                                    <input
                                        type="text"
                                        value={linkedinUrl}
                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                        placeholder="https://linkedin.com/in/username"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                        <FaGithub className="text-slate-300 w-4 h-4" />
                                        GitHub Profile URL
                                    </label>
                                    <input
                                        type="text"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        placeholder="https://github.com/username"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                        <Globe className="text-emerald-400 w-4 h-4" />
                                        Portfolio Website URL
                                    </label>
                                    <input
                                        type="text"
                                        value={portfolioUrl}
                                        onChange={(e) => setPortfolioUrl(e.target.value)}
                                        placeholder="https://yourportfolio.dev"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Professional Bio */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Executive Summary / Bio</h3>
                                    <p className="text-[11px] text-slate-400">Summarize your background, achievements, and technical philosophy</p>
                                </div>
                                <span className={`text-xs font-bold ${bio.length > 450 ? "text-amber-400" : "text-slate-400"}`}>
                                    {bio.length} / 500
                                </span>
                            </div>

                            <textarea
                                rows={4}
                                maxLength={500}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Passionate engineer with expertise in building scalable cloud architectures, high performance web apps, and AI tooling..."
                                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl p-4 text-sm text-white focus:outline-none transition-all resize-none leading-relaxed"
                            />
                        </div>

                        {/* Section 5: Skills & Tech Stack */}
                        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Technical Skills & Expertise ({skills.length})</h3>
                                    <p className="text-[11px] text-slate-400">Key technologies used for ATS matching and interview questions</p>
                                </div>
                                <span className="text-[11px] text-indigo-400 font-semibold">Press Enter or comma to add</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleSkillKeyDown}
                                    placeholder="Add a technology or tool (e.g. Next.js, Docker, Python)..."
                                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddSkill()}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/25 shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add</span>
                                </button>
                            </div>

                            {/* Active Skills Cloud */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 min-h-[70px]">
                                {skills.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-2">
                                        No skills added yet. Type your key competencies above or click quick suggestions below.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-200 border border-indigo-500/25 shadow-sm"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="text-indigo-400 hover:text-red-400 transition-colors cursor-pointer"
                                                    title={`Remove ${skill}`}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Suggestions */}
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 mb-2">Quick Suggestions (Click to add):</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {COMMON_SKILLS.filter(
                                        (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
                                    ).map((skill) => (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => handleAddSkill(skill)}
                                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
                                        >
                                            + {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                            <Link
                                to="/dashboard"
                                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {authLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Save Profile Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default ProfilePage;
