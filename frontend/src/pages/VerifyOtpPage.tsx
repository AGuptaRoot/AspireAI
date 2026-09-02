import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Sparkles, KeyRound, AlertCircle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";

export const VerifyOtpPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const queryEmail = searchParams.get("email") || "";
    const { verifyOtp, resendOtp, authLoading, authError, clearAuthError } = useAppStore();

    const [email, setEmail] = useState(queryEmail);
    const [otp, setOtp] = useState("");
    const [resendCooldown, setResendCooldown] = useState(60);
    const [resendSuccess, setResendSuccess] = useState(false);
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

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAuthError();

        const success = await verifyOtp({ email, otp });
        if (success) {
            navigate("/dashboard");
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || !email) return;

        const sent = await resendOtp(email);
        if (sent) {
            setResendSuccess(true);
            setResendCooldown(60);
            setTimeout(() => setResendSuccess(false), 4000);
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
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Verify Your Email</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Enter the 6-digit OTP verification code sent to your email.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        {authError && (
                            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Verification Error</p>
                                    <p className="mt-0.5">{authError}</p>
                                </div>
                            </div>
                        )}

                        {resendSuccess && (
                            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>A fresh OTP has been sent to your email!</span>
                            </div>
                        )}

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    6-Digit Verification Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder="123456"
                                    className="w-full tracking-[8px] text-center font-mono font-bold bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-xl text-indigo-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading || otp.length < 4}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {authLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying OTP...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Verify & Activate
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Resend OTP */}
                        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-between">
                            <span>Didn't receive the email?</span>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                className="flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <RefreshCw className="w-3 h-3" />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
