import { IUser } from "../models/users.models.js";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            sessionId?: string;
        }
    }
}
