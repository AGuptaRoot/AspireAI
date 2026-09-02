import mongoose from "mongoose";
import app from "./dist/index.js";
import OtpModel from "./dist/models/Otp.model.js";
import userModel from "./dist/models/users.models.js";
import ResumeModel from "./dist/models/resume.models.js";
import SessionModel from "./dist/models/session.models.js";
import ChatSessionModel from "./dist/models/chat.models.js";
import crypto from "crypto";

// Minimal valid PDF binary
const samplePdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 280 >>
stream
BT
/F1 14 Tf
50 700 Td
(Adarsh Gupta - Senior Full Stack MERN AI Engineer) Tj
0 -20 Td
(Technical Skills: React, Node.js, Express, MongoDB, TypeScript, LangChain, OpenAI, Docker, AWS) Tj
0 -20 Td
(Soft Skills: Leadership, Teamwork, Problem Solving, Agile Communication) Tj
0 -20 Td
(Experience: Architected AI Interviewer platform serving 10k users, reducing latency by 45%) Tj
0 -20 Td
(Projects: Automated Resume ATS Parser with vector embeddings and LangChain RAG) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000323 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF`;

async function runTests() {
    console.log("==========================================================");
    console.log("🚀 Starting AspireAI Backend Full ATS & AI Chat E2E Tests...");
    console.log("==========================================================\n");

    const BASE_URL = `http://localhost:${process.env.PORT || 8000}`;
    const testEmail = `candidate_${Date.now()}@example.com`;
    const testPassword = "Password123!";
    const testUsername = "AdarshCandidate";
    const testProfession = "Full Stack AI Engineer";

    let accessToken = "";
    let refreshTokenCookie = "";
    let uploadedResumeId = "";
    let registeredUserId = "";

    try {
        // 1. Health Check
        console.log("1️⃣ Testing GET /api/health...");
        const healthRes = await fetch(`${BASE_URL}/api/health`);
        const healthData = await healthRes.json();
        console.log("   Status:", healthRes.status, healthData.status);
        if (healthRes.status !== 200) throw new Error("Health check failed");

        // 2. User Registration
        console.log("\n2️⃣ Testing POST /api/auth/register...");
        const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: testUsername,
                email: testEmail,
                password: testPassword,
                profession: testProfession,
            }),
        });
        const regData = await regRes.json();
        console.log("   Status:", regRes.status, regData.message);
        if (regRes.status !== 201) throw new Error("Registration failed");
        registeredUserId = regData.user._id;

        // 3. Retrieve OTP from DB to simulate email OTP
        console.log("\n3️⃣ Retrieving OTP from DB for verification...");
        const otpRecord = await OtpModel.findOne({ email: testEmail });
        if (!otpRecord) throw new Error("OTP document not created in DB");

        const testOtpValue = "654321";
        otpRecord.otpHash = crypto.createHash("sha256").update(testOtpValue).digest("hex");
        await otpRecord.save();

        // 4. Verify OTP
        console.log("\n4️⃣ Testing POST /api/auth/verify-otp...");
        const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                otp: testOtpValue,
            }),
        });
        const verifyData = await verifyRes.json();
        const setCookieHeader = verifyRes.headers.get("set-cookie");
        if (setCookieHeader) {
            refreshTokenCookie = setCookieHeader.split(";")[0];
        }
        console.log("   Status:", verifyRes.status, "Message:", verifyData.message);
        if (verifyRes.status !== 200 || !verifyData.accessToken) throw new Error("OTP Verification failed");

        accessToken = verifyData.accessToken;
        console.log("   ✅ Access token successfully acquired!");

        // 5. User Login
        console.log("\n5️⃣ Testing POST /api/auth/login...");
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
            }),
        });
        const loginData = await loginRes.json();
        console.log("   Status:", loginRes.status, "Login Success:", loginData.success);
        if (loginRes.status !== 200 || !loginData.accessToken) throw new Error("Login failed");
        accessToken = loginData.accessToken;

        // 6. Upload PDF Resume & Check AI ATS Score Processing
        console.log("\n6️⃣ Testing POST /api/resume/upload (PDF parsing + AI ATS analysis)...");
        const formData = new FormData();
        const pdfBlob = new Blob([Buffer.from(samplePdf)], { type: "application/pdf" });
        formData.append("document", pdfBlob, "Adarsh_Gupta_Resume.pdf");

        const uploadRes = await fetch(`${BASE_URL}/api/resume/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });
        const uploadData = await uploadRes.json();
        console.log("   Status:", uploadRes.status, "Message:", uploadData.message);
        console.log("   ATS Score:", uploadData.resume?.analysis?.atsScore, "| Grade:", uploadData.resume?.analysis?.atsGrade);
        console.log("   Target Job Roles:", uploadData.resume?.analysis?.targetJobRoles?.slice(0, 2));

        if (uploadRes.status !== 201 || !uploadData.resume?._id) throw new Error("Resume upload & ATS analysis failed");
        uploadedResumeId = uploadData.resume._id;

        // 7. Get Resume Analytics & ATS Report
        console.log("\n7️⃣ Testing GET /api/resume/latest/analytics (Detailed ATS Report)...");
        const analyticsRes = await fetch(`${BASE_URL}/api/resume/latest/analytics`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const analyticsData = await analyticsRes.json();
        console.log("   Status:", analyticsRes.status);
        console.log("   Category Scores:", analyticsData.analysis?.categoryScores);
        console.log("   Top Strengths:", analyticsData.analysis?.strengths?.slice(0, 2));
        console.log("   Recommendations:", analyticsData.analysis?.actionableRecommendations?.slice(0, 2));
        if (analyticsRes.status !== 200 || !analyticsData.analysis?.atsScore) throw new Error("Get analytics failed");

        // 8. Re-trigger Analysis on specific resume ID
        console.log("\n8️⃣ Testing POST /api/resume/:id/analyze...");
        const reAnalyzeRes = await fetch(`${BASE_URL}/api/resume/${uploadedResumeId}/analyze`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const reAnalyzeData = await reAnalyzeRes.json();
        console.log("   Status:", reAnalyzeRes.status, "Message:", reAnalyzeData.message);
        if (reAnalyzeRes.status !== 200) throw new Error("Re-analysis failed");

        // 9. AI Career Assistant Chat using Vector Embeddings & RAG
        console.log("\n9️⃣ Testing POST /api/resume/chat (AI Career Coach with Vector RAG)...");
        const chatRes1 = await fetch(`${BASE_URL}/api/resume/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                query: "What career paths and jobs should I target based on my skills and projects?",
                resumeId: uploadedResumeId,
            }),
        });
        const chatData1 = await chatRes1.json();
        console.log("   Status:", chatRes1.status);
        console.log("   AI Response:\n" + chatData1.response?.slice(0, 200) + "...\n");
        if (chatRes1.status !== 200 || !chatData1.response) throw new Error("AI Chat failed");

        // 10. AI Career Assistant Query (Follow-up Question)
        console.log("🔟 Testing POST /api/resume/query (Follow-up advice)...");
        const chatRes2 = await fetch(`${BASE_URL}/api/resume/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                query: "How can I improve my ATS score and project descriptions?",
                resumeId: uploadedResumeId,
            }),
        });
        const chatData2 = await chatRes2.json();
        console.log("   Status:", chatRes2.status);
        console.log("   AI Follow-up:\n" + chatData2.response?.slice(0, 200) + "...\n");
        if (chatRes2.status !== 200 || !chatData2.response) throw new Error("AI Query failed");

        // 11. Retrieve Chat History
        console.log("1️⃣1️⃣ Testing GET /api/resume/chat-history...");
        const historyRes = await fetch(`${BASE_URL}/api/resume/chat-history`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const historyData = await historyRes.json();
        console.log("   Status:", historyRes.status, "Total Messages in Conversation:", historyData.messages?.length);
        if (historyRes.status !== 200 || historyData.messages?.length < 4) throw new Error("Chat history retrieval failed");

        // 12. Clear Chat History
        console.log("\n1️⃣2️⃣ Testing DELETE /api/resume/chat-history...");
        const clearChatRes = await fetch(`${BASE_URL}/api/resume/chat-history`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const clearChatData = await clearChatRes.json();
        console.log("   Status:", clearChatRes.status, "Message:", clearChatData.message);
        if (clearChatRes.status !== 200) throw new Error("Clear chat history failed");

        // 13. Delete Resume & Associated Data
        console.log("\n1️⃣3️⃣ Testing DELETE /api/resume/:id...");
        const deleteRes = await fetch(`${BASE_URL}/api/resume/${uploadedResumeId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const deleteData = await deleteRes.json();
        console.log("   Status:", deleteRes.status, "Message:", deleteData.message);
        if (deleteRes.status !== 200) throw new Error("Delete resume failed");

        // 14. Logout
        console.log("\n1️⃣4️⃣ Testing POST /api/auth/logout...");
        const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: { Cookie: refreshTokenCookie },
        });
        const logoutData = await logoutRes.json();
        console.log("   Status:", logoutRes.status, "Message:", logoutData.message);
        if (logoutRes.status !== 200) throw new Error("Logout failed");

        // 15. Cleanup Database
        console.log("\n🧹 Cleaning up test candidate from MongoDB...");
        await userModel.findByIdAndDelete(registeredUserId);
        await SessionModel.deleteMany({ user: registeredUserId });
        await ResumeModel.deleteMany({ user: registeredUserId });
        await ChatSessionModel.deleteMany({ user: registeredUserId });
        await OtpModel.deleteMany({ email: testEmail });
        console.log("   Cleaned up test candidate successfully.");

        console.log("\n==========================================================");
        console.log("🎉 ALL RESUME AI & INTERVIEWER BACKEND TESTS PASSED 100%!");
        console.log("==========================================================\n");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
        process.exit(1);
    }
}

runTests();
