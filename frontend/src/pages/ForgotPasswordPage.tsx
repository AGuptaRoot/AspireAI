import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Mail, AlertCircle, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";

export const ForgotPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const queryEmail = searchParams.get("email") || "";
    const [email, setEmail] = useState(queryEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            const res = await api.auth.forgotPassword({ email });
            if (res.success) {
                setSuccessMessage(res.message || "A password reset code has been sent to your email.");
                setTimeout(() => {
                    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
                }, 1500);
            } else {
                setError(res.message || "Failed to send reset code.");
            }
        } catch (err: any) {
            setError(err.message || "No account found with this email address.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Back Link */}
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
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-amber-500/20">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Forgot Password?</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                            Don't worry! Enter your email and we will send you a 6-digit code to reset your password.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        {error && (
                            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Request Failed</p>
                                    <p className="mt-0.5">{error}</p>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Code Dispatched!</p>
                                    <p className="mt-0.5">{successMessage}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">Redirecting to reset page...</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Registered Email Address
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

                            <button
                                type="submit"
                                disabled={isLoading || !email.trim()}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sending Code...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send Reset Code</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
                            Remembered your password?{" "}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
