import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, KeyRound, AlertCircle, Loader2, ArrowLeft, CheckCircle2, RefreshCw, Check, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import confetti from "canvas-confetti";

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const queryEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState(queryEmail);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [resendCooldown, setResendCooldown] = useState(60);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (queryEmail) setEmail(queryEmail);
    }, [queryEmail]);

    useEffect(() => {
        let timer: any;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match. Please ensure both passwords are identical.");
            return;
        }

        if (otp.length < 4) {
            setError("Please enter the complete 6-digit OTP code.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await api.auth.resetPassword({
                email,
                otp: otp.trim(),
                newPassword,
            });

            if (res.success) {
                setSuccess(true);
                try {
                    confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.6 },
                    });
                } catch {
                    // ignore if confetti fails
                }
                setTimeout(() => {
                    navigate(`/login?reset=success&email=${encodeURIComponent(email)}`);
                }, 2000);
            } else {
                setError(res.message || "Failed to reset password.");
            }
        } catch (err: any) {
            setError(err.message || "Invalid or expired password reset code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || !email) return;

        try {
            const res = await api.auth.forgotPassword({ email });
            if (res.success) {
                setResendSuccess(true);
                setResendCooldown(60);
                setTimeout(() => setResendSuccess(false), 4000);
            } else {
                setError(res.message || "Failed to resend reset code.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to resend reset code.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Back to Login Link */}
                    <div className="mb-6">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Sign In</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Set New Password</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Enter the 6-digit code sent to your email and your new password.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        {error && (
                            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Reset Failed</p>
                                    <p className="mt-0.5">{error}</p>
                                </div>
                            </div>
                        )}

                        {resendSuccess && (
                            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>A fresh 6-digit reset code has been sent to your email!</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Password Reset Successful!</p>
                                    <p className="mt-0.5">Redirecting to login with your new credentials...</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
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

                            {/* 6-Digit OTP */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-300">
                                        6-Digit Reset Code
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0}
                                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
                                    </button>
                                </div>
                                <div className="relative">
                                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        placeholder="123456"
                                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-[4px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Confirm New Password
                                    </label>
                                    {passwordsMatch && (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                            <Check className="w-3 h-3" /> Passwords match
                                        </span>
                                    )}
                                    {passwordsMismatch && (
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                            <X className="w-3 h-3" /> Passwords do not match
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                                            passwordsMismatch
                                                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                                                : passwordsMatch
                                                ? "border-emerald-500/80 focus:border-emerald-500 focus:ring-emerald-500"
                                                : "border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500"
                                        }`}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || success || otp.length < 4 || newPassword.length < 6}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        <span>Reset Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
