import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/config.js";
import dbConnection from "./config/mongodb_connect.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/users.routes.js";
import resumeRouter from "./routes/resume.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import builderRouter from "./routes/builder.routes.js";

const app = express();

// 1. Initialize MongoDB Connection
dbConnection();

// 2. Security & Parsing Middlewares
const allowedOrigins = [
    config.Client_Url,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, true); // Allow during dev / configurable for prod
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 3. Health Check Endpoint
app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        service: "AspireAI Backend",
        timestamp: new Date().toISOString(),
    });
});

// 4. API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/builder", builderRouter);

// 5. 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
});

// 6. Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled Global Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected internal server error occurred.",
        ...(config.Node_env === "development" && { stack: err.stack }),
    });
});

// 7. Start Server
const server = app.listen(config.Port, () => {
    console.log(`🚀 AspireAI Backend running on http://localhost:${config.Port}`);
    console.log(`🌍 Environment: ${config.Node_env}`);
    console.log(`📄 Resume API ready at http://localhost:${config.Port}/api/resume`);
});

// Graceful Shutdown
process.on("SIGINT", () => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
        console.log("Server stopped.");
        process.exit(0);
    });
});

export default app;