import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Sparkles, Mail, Lock, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";

export const LoginPage: React.FC = () => {
    const { login, authLoading, authError, clearAuthError, pendingVerificationEmail } = useAppStore();
    const [searchParams] = useSearchParams();
    const resetSuccess = searchParams.get("reset") === "success";
    const initialEmail = searchParams.get("email") || "";
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || "/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAuthError();

        const success = await login({ email, password });
        if (success) {
            navigate(from, { replace: true });
        } else if (pendingVerificationEmail) {
            navigate(`/verify-otp?email=${encodeURIComponent(pendingVerificationEmail)}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome Back</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Sign in to your AspireAI account to access your resume analysis and career coach.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        {resetSuccess && (
                            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Password reset successfully! Please sign in with your new password.</span>
                            </div>
                        )}

                        {authError && (
                            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Sign In Failed</p>
                                    <p className="mt-0.5">{authError}</p>
                                    {pendingVerificationEmail && (
                                        <Link
                                            to={`/verify-otp?email=${encodeURIComponent(pendingVerificationEmail)}`}
                                            className="text-indigo-400 underline font-semibold mt-1 inline-block"
                                        >
                                            Verify OTP now →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="candidate@example.com"
                                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Password
                                    </label>
                                    <Link
                                        to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
                                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {authLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                                Create an account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
