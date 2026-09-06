import React from "react";
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export const RouteErrorBoundary: React.FC = () => {
    const error = useRouteError();

    let errorMessage = "An unexpected error occurred in this section.";
    let errorDetails = "";

    if (isRouteErrorResponse(error)) {
        errorMessage = error.statusText || `Error ${error.status}`;
        errorDetails = typeof error.data === "string" ? error.data : JSON.stringify(error.data);
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || "";
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                    <AlertTriangle className="w-7 h-7" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Something went wrong
                </h1>
                <p className="text-sm text-slate-400 mb-6">
                    {errorMessage}
                </p>

                {errorDetails && (
                    <details className="mb-6 text-left bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                        <summary className="text-xs text-slate-400 font-mono cursor-pointer hover:text-slate-200 select-none">
                            Technical Details
                        </summary>
                        <pre className="mt-2 text-[11px] text-rose-400/90 overflow-x-auto whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                            {errorDetails}
                        </pre>
                    </details>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reload Page</span>
                    </button>
                    <Link
                        to="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                    >
                        <Home className="w-4 h-4" />
                        <span>Go to Dashboard</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RouteErrorBoundary;
