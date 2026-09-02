import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import userModel, { IUser } from "../models/users.models.js";
import SessionModel from "../models/session.models.js";

interface JwtPayload {
    id: string;
    sessionId?: string;
    iat?: number;
    exp?: number;
}

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let token: string | undefined;

        // 1. Check Authorization header: "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        // 2. Check cookies fallback
        if (!token && req.cookies?.AccessToken) {
            token = req.cookies.AccessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please provide a valid token.",
            });
        }

        // 3. Verify JWT
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, config.Jwt_Secret) as JwtPayload;
        } catch (jwtErr: any) {
            return res.status(401).json({
                success: false,
                message:
                    jwtErr.name === "TokenExpiredError"
                        ? "Session has expired. Please refresh token or login again."
                        : "Invalid authentication token.",
            });
        }

        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload.",
            });
        }

        // 4. Validate session if sessionId is embedded
        if (decoded.sessionId) {
            const session = await SessionModel.findOne({
                _id: decoded.sessionId,
                revoked: false,
            });

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: "Session is revoked or expired. Please login again.",
                });
            }
            req.sessionId = session._id.toString();
        }

        // 5. Find User
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account associated with this token no longer exists.",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Email address is not verified. Please verify your OTP.",
            });
        }

        // 6. Attach user to request
        req.user = user;
        next();
    } catch (error: any) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Authentication verification failed.",
        });
    }
};
