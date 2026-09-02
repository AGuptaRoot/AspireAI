import mongoose from "mongoose";
import { config } from "./config.js";
const dbConnection = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("✅ MongoDB successfully connected.");
        });
        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });
        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected.");
        });
        await mongoose.connect(config.Mongodb_uri);
    }
    catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        // Do not crash immediately in dev so app can initialize
    }
};
export default dbConnection;
