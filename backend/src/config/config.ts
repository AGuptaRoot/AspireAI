import { configDotenv } from "dotenv";

configDotenv();

export const config = {
    Port: parseInt(process.env.PORT || "8000", 10),
    Node_env: process.env.NODE_ENV || "development",
    Mongodb_uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aspire_ai",
    Jwt_Secret: process.env.JWT_SECRET || "default_jwt_secret_key_change_in_prod",
    Jwt_Access_Expires_In: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    Jwt_Refresh_Expires_In: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    Client_Url: process.env.CLIENT_URL || "http://localhost:5173",
    Gemini: {
        ApiKey: process.env.GEMINI_API_KEY || "",
        Model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        EmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",
    },
    Email: {
        Service: process.env.EMAIL_SERVICE || "gmail",
        User: process.env.EMAIL_USER || "adarshguptacoder@gmail.com",
        AppPassword: process.env.EMAIL_APP_PASSWORD || "",
        From: process.env.EMAIL_FROM || '"AspireAI" <adarshguptacoder@gmail.com>',
    },
};