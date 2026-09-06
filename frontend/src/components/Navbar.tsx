import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
    Sparkles,
    BrainCircuit,
    User as UserIcon,
    LogOut,
    ChevronDown,
    ChevronRight,
    ShieldCheck,
    Menu,
    X,
    LayoutDashboard,
} from "lucide-react";

const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const userMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        await logout();
        navigate("/login");
    };

    const isActive = (path: string) => {
        if (path === "/dashboard") {
            return location.pathname === "/dashboard" && !location.search.includes("tab=chat");
        }
        return location.pathname === path;
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isUserMenuOpen]);

    // Close menus on route change
    useEffect(() => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
    }, [location.pathname, location.search]);

    const userDisplayName = user?.fullName || user?.username || "Candidate";
    const userInitials = (user?.fullName || user?.username || "U").slice(0, 2).toUpperCase();

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                            Aspire<span className="text-indigo-400">AI</span>
                        </span>
                        <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            Career Suite
                        </span>
                    </div>
                </Link>

                {/* Primary Center Navigation Links (Streamlined) */}
                {isAuthenticated ? (
                    <nav className="hidden md:flex items-center gap-1.5">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                                isActive("/dashboard")
                                    ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 shadow-sm"
                                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/builder"
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                                isActive("/builder")
                                    ? "text-amber-400 bg-amber-500/10 border border-amber-500/25 shadow-sm"
                                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                            }`}
                        >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>Resume Builder</span>
                        </Link>

                        <Link
                            to="/interview"
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                                isActive("/interview")
                                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 shadow-sm"
                                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                            }`}
                        >
                            <BrainCircuit className="w-4 h-4 text-emerald-400" />
                            <span>AI Interviewer</span>
                        </Link>
                    </nav>
                ) : (
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                                isActive("/")
                                    ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-sm"
                                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                            }`}
                        >
                            Home
                        </Link>
                    </nav>
                )}

                {/* Right Side: User Profile Dropdown or Auth Links */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {isAuthenticated && user ? (
                        <div className="relative" ref={userMenuRef}>
                            {/* Polished User Profile Trigger Pill */}
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-sm focus:outline-none"
                                aria-label="Open Candidate Account Menu"
                                aria-expanded={isUserMenuOpen}
                            >
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-md group-hover:scale-105 transition-transform shrink-0">
                                    {userInitials}
                                </div>
                                <div className="hidden sm:block text-left max-w-[130px]">
                                    <p className="text-xs font-bold text-white truncate leading-none">
                                        {userDisplayName}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                                        {user.targetRole || user.profession || "Candidate"}
                                    </p>
                                </div>
                                <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 hidden sm:block ${
                                        isUserMenuOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {/* Dropdown Menu Popover */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-12 sm:top-14 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-slate-950/90 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    {/* Candidate Card Summary */}
                                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                                                {userInitials}
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-white truncate">
                                                        {userDisplayName}
                                                    </p>
                                                    <span className="text-emerald-400" title="Candidate Verified">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                                <p className="text-[10px] text-indigo-400 font-semibold mt-0.5 truncate">
                                                    {user.targetRole || user.profession || "Candidate Profile"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-1 text-xs font-semibold">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                                                isActive("/profile")
                                                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                                    : "text-slate-200 hover:text-white hover:bg-slate-800 border border-transparent"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <UserIcon className="w-4 h-4 text-indigo-400" />
                                                <span>Edit Profile & Settings</span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                        </Link>

                                        <Link
                                            to="/dashboard"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                                                isActive("/dashboard")
                                                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                                    : "text-slate-200 hover:text-white hover:bg-slate-800 border border-transparent"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                                                <span>Dashboard</span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                                        </Link>

                                        <Link
                                            to="/builder"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-all border border-transparent group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Sparkles className="w-4 h-4 text-amber-400" />
                                                <span>AI Resume Builder</span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>

                                        <Link
                                            to="/interview"
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-all border border-transparent group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                                                <span>AI Interviewer</span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>

                                    {/* Sign Out Action */}
                                    <div className="mt-2 pt-2 border-t border-slate-800">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all cursor-pointer"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Hamburger Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden ml-1 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
                                aria-label="Toggle mobile menu"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition-all"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Dropdown Menu (Authenticated) */}
            {isMobileMenuOpen && isAuthenticated && (
                <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-900"
                    >
                        <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        to="/builder"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-900"
                    >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>AI Resume Builder</span>
                    </Link>
                    <Link
                        to="/interview"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-900"
                    >
                        <BrainCircuit className="w-4 h-4 text-emerald-400" />
                        <span>AI Interviewer</span>
                    </Link>
                    <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/20"
                    >
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                        <span>Edit Profile & Settings</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 text-left cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Navbar;
