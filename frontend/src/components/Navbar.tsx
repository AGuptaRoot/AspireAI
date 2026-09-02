import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Sparkles, FileText, MessageSquare, LogOut, User as UserIcon } from "lucide-react";

const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                            Aspire<span className="text-indigo-400">AI</span>
                        </span>
                        <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            Resume & Interview AI
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-1">
                    <Link
                        to="/"
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive("/")
                                ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                                : "text-slate-300 hover:text-white hover:bg-slate-900"
                        }`}
                    >
                        Home
                    </Link>

                    {isAuthenticated && (
                        <>
                            <Link
                                to="/dashboard"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive("/dashboard")
                                        ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                                        : "text-slate-300 hover:text-white hover:bg-slate-900"
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                ATS Scanner
                            </Link>

                            <Link
                                to="/dashboard?tab=chat"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                            >
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                                AI Career Coach
                            </Link>
                        </>
                    )}
                </nav>

                {/* User Auth Buttons */}
                <div className="flex items-center gap-3">
                    {isAuthenticated && user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                    {user.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-semibold text-slate-200 leading-none">{user.username}</p>
                                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{user.profession}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                title="Sign out"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition-all"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
