import mongoose from "mongoose";
import app from "./dist/index.js";
import OtpModel from "./dist/models/Otp.model.js";
import userModel from "./dist/models/users.models.js";
import ResumeModel from "./dist/models/resume.models.js";
import SessionModel from "./dist/models/session.models.js";
import ChatSessionModel from "./dist/models/chat.models.js";
import InterviewModel from "./dist/models/interview.models.js";
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

        // 5b. Forgot Password Request
        console.log("\n5️⃣b Testing POST /api/auth/forgot-password...");
        const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail }),
        });
        const forgotData = await forgotRes.json();
        console.log("   Status:", forgotRes.status, "Message:", forgotData.message);
        if (forgotRes.status !== 200) throw new Error("Forgot password request failed");

        // Retrieve the reset OTP from DB
        const resetOtpRecord = await OtpModel.findOne({ email: testEmail, purpose: "password_reset" });
        if (!resetOtpRecord) throw new Error("Password reset OTP record not found in DB");

        const resetOtpValue = "998877";
        resetOtpRecord.otpHash = crypto.createHash("sha256").update(resetOtpValue).digest("hex");
        await resetOtpRecord.save();

        // 5c. Reset Password
        console.log("\n5️⃣c Testing POST /api/auth/reset-password...");
        const newPassword = "NewSecurePassword123!";
        const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                otp: resetOtpValue,
                newPassword: newPassword,
            }),
        });
        const resetData = await resetRes.json();
        console.log("   Status:", resetRes.status, "Message:", resetData.message);
        if (resetRes.status !== 200) throw new Error("Reset password failed");

        // 5d. Verify Login with New Password
        console.log("\n5️⃣d Testing Login with New Password...");
        const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: newPassword,
            }),
        });
        const newLoginData = await newLoginRes.json();
        console.log("   Status:", newLoginRes.status, "Login Success:", newLoginData.success);
        if (newLoginRes.status !== 200 || !newLoginData.accessToken) throw new Error("Login with new password failed");
        accessToken = newLoginData.accessToken;

        // 5e. Update User Profile & Verification
        console.log("\n5️⃣e Testing PUT /api/auth/profile (Update Candidate Profile)...");
        const profilePayload = {
            fullName: "Adarsh K. Gupta",
            profession: "Principal AI Systems Architect",
            targetRole: "VP of Engineering & AI",
            phone: "+1 (555) 234-5678",
            location: "San Francisco, CA",
            bio: "Specialized in distributed LLM architectures and automated ATS pipelines.",
            linkedinUrl: "https://linkedin.com/in/adarshgupta",
            githubUrl: "https://github.com/adarshgupta",
            portfolioUrl: "https://adarsh.tech",
            skills: ["TypeScript", "Node.js", "React", "Vector DB", "LangChain"],
        };
        const updateProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(profilePayload),
        });
        const updateProfileData = await updateProfileRes.json();
        console.log("   Status:", updateProfileRes.status, "Message:", updateProfileData.message);
        console.log("   Updated Full Name:", updateProfileData.user?.fullName);
        console.log("   Updated Profession:", updateProfileData.user?.profession);
        console.log("   Updated Skills:", updateProfileData.user?.skills);

        if (
            updateProfileRes.status !== 200 ||
            updateProfileData.user?.fullName !== profilePayload.fullName ||
            updateProfileData.user?.targetRole !== profilePayload.targetRole ||
            updateProfileData.user?.skills?.length !== profilePayload.skills.length
        ) {
            throw new Error("Update candidate profile failed");
        }

        // Verify GET /api/auth/me returns updated fields
        console.log("\n5️⃣f Testing GET /api/auth/me (Verify persisted profile)...");
        const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const meData = await meRes.json();
        console.log("   Status:", meRes.status, "Username:", meData.user?.username, "Target Role:", meData.user?.targetRole);
        if (meRes.status !== 200 || meData.user?.targetRole !== profilePayload.targetRole) {
            throw new Error("GET /api/auth/me failed to return updated profile");
        }

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
        // 12b. AI Resume Builder Tests
        console.log("\n1️⃣2️⃣b Testing POST /api/builder/generate (AI generates resume based on old resume)...");
        const generateBuilderRes = await fetch(`${BASE_URL}/api/builder/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                resumeId: uploadedResumeId,
                targetRole: "Full Stack Architect",
                title: "Architect Level AI Resume",
            }),
        });
        const generateBuilderData = await generateBuilderRes.json();
        console.log("   Status:", generateBuilderRes.status, "Message:", generateBuilderData.message);
        console.log("   Generated Resume Title:", generateBuilderData.resume?.title);
        console.log("   Content Snippet:\n   " + generateBuilderData.resume?.content?.slice(0, 100).replace(/\n/g, " ") + "...");
        if (generateBuilderRes.status !== 201 || !generateBuilderData.resume?._id) {
            throw new Error("AI Resume Builder generation failed");
        }
        const createdBuilderId = generateBuilderData.resume._id;

        // 12c. List Builder Resumes
        console.log("\n1️⃣2️⃣c Testing GET /api/builder (List all user builder resumes)...");
        const listBuilderRes = await fetch(`${BASE_URL}/api/builder`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const listBuilderData = await listBuilderRes.json();
        console.log("   Status:", listBuilderRes.status, "Total Builder Resumes:", listBuilderData.count);
        if (listBuilderRes.status !== 200 || listBuilderData.count < 1) {
            throw new Error("List builder resumes failed");
        }

        // 12d. Update Builder Resume
        console.log("\n1️⃣2️⃣d Testing PUT /api/builder/:id (Update resume content)...");
        const updateBuilderRes = await fetch(`${BASE_URL}/api/builder/${createdBuilderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                title: "Master Full Stack Architect Resume (Edited)",
                content: generateBuilderData.resume.content + "\n\n## Additional Achievements\n- Accelerated delivery velocity across 4 cross-functional squads.",
            }),
        });
        const updateBuilderData = await updateBuilderRes.json();
        console.log("   Status:", updateBuilderRes.status, "Updated Title:", updateBuilderData.resume?.title);
        if (updateBuilderRes.status !== 200 || !updateBuilderData.resume?.title?.includes("Edited")) {
            throw new Error("Update builder resume failed");
        }

        // 12e. AI Analysis of Builder Resume
        console.log("\n1️⃣2️⃣e Testing POST /api/builder/:id/analyze (AI ATS evaluation & scoring of edited resume)...");
        const analyzeBuilderRes = await fetch(`${BASE_URL}/api/builder/${createdBuilderId}/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                content: updateBuilderData.resume.content,
            }),
        });
        const analyzeBuilderData = await analyzeBuilderRes.json();
        console.log("   Status:", analyzeBuilderRes.status, "ATS Score:", analyzeBuilderData.analysis?.atsScore + "/100", "Grade:", analyzeBuilderData.analysis?.atsGrade);
        console.log("   Top Strength:", analyzeBuilderData.analysis?.strengths?.[0]);
        if (analyzeBuilderRes.status !== 200 || analyzeBuilderData.analysis?.atsScore === undefined) {
            throw new Error("Analyze builder resume failed");
        }

        // 12f. Delete Builder Resume
        console.log("\n1️⃣2️⃣f Testing DELETE /api/builder/:id (CRUD delete)...");
        const deleteBuilderRes = await fetch(`${BASE_URL}/api/builder/${createdBuilderId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const deleteBuilderData = await deleteBuilderRes.json();
        console.log("   Status:", deleteBuilderRes.status, "Message:", deleteBuilderData.message);
        if (deleteBuilderRes.status !== 200) {
            throw new Error("Delete builder resume failed");
        }

        // 13. Delete Resume & Associated Data
        console.log("\n1️⃣3️⃣ Testing DELETE /api/resume/:id...");
        const deleteRes = await fetch(`${BASE_URL}/api/resume/${uploadedResumeId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const deleteData = await deleteRes.json();
        console.log("   Status:", deleteRes.status, "Message:", deleteData.message);
        if (deleteRes.status !== 200) throw new Error("Delete resume failed");

        // 13b. AI Interviewer Feature Tests
        console.log("\n1️⃣3️⃣b Testing POST /api/interview/start (AI generates 10 MCQ rounds for field)...");
        const startInterviewRes = await fetch(`${BASE_URL}/api/interview/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                field: "Full Stack Engineer",
                difficulty: "Mid-Level",
            }),
        });
        const startInterviewData = await startInterviewRes.json();
        console.log("   Status:", startInterviewRes.status, "Message:", startInterviewData.message);
        console.log("   Total Rounds:", startInterviewData.interview?.totalQuestions, "Duration:", startInterviewData.interview?.durationMinutes + " mins");
        console.log("   Round 1 Question:", startInterviewData.interview?.questions[0]?.question?.slice(0, 60) + "...");
        if (startInterviewRes.status !== 201 || startInterviewData.interview?.questions?.length !== 10) {
            throw new Error("AI Interview start failed");
        }
        const createdInterviewId = startInterviewData.interview._id;

        // 13c. Submit Interview Assessment
        console.log("\n1️⃣3️⃣c Testing POST /api/interview/:id/submit (10-Round scoring & timer)...");
        const submitInterviewRes = await fetch(`${BASE_URL}/api/interview/${createdInterviewId}/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                answers: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 },
                timeSpentSeconds: 145,
            }),
        });
        const submitInterviewData = await submitInterviewRes.json();
        console.log("   Status:", submitInterviewRes.status, "Score:", submitInterviewData.result?.score + "/10 (" + submitInterviewData.result?.percentage + "%)");
        console.log("   Passed Status:", submitInterviewData.result?.passed, "Time Spent:", submitInterviewData.result?.timeSpentSeconds + "s");
        console.log("   Feedback:\n   " + submitInterviewData.result?.feedback);
        if (submitInterviewRes.status !== 200 || submitInterviewData.result?.score === undefined) {
            throw new Error("Submit interview assessment failed");
        }

        // 13d. Retrieve Interview Result
        console.log("\n1️⃣3️⃣d Testing GET /api/interview/:id (Scorecard & Solutions)...");
        const getInterviewRes = await fetch(`${BASE_URL}/api/interview/${createdInterviewId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const getInterviewData = await getInterviewRes.json();
        console.log("   Status:", getInterviewRes.status, "Questions with Solutions:", getInterviewData.interview?.questions?.length);
        if (getInterviewRes.status !== 200 || !getInterviewData.interview?.questions[0]?.explanation) {
            throw new Error("Get interview scorecard failed");
        }

        // 13e. Retrieve User Interview History
        console.log("\n1️⃣3️⃣e Testing GET /api/interview (Past Interviews History)...");
        const listInterviewRes = await fetch(`${BASE_URL}/api/interview`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const listInterviewData = await listInterviewRes.json();
        console.log("   Status:", listInterviewRes.status, "Total User Interviews:", listInterviewData.count);
        if (listInterviewRes.status !== 200 || listInterviewData.count < 1) {
            throw new Error("Get user interviews history failed");
        }

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
        await InterviewModel.deleteMany({ user: registeredUserId });
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
