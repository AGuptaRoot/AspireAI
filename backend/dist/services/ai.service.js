import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { config } from "../config/config.js";
/**
 * Initialize Gemini Chat Model
 */
export const getChatModel = (temperature = 0.4) => {
    const apiKey = config.Gemini.ApiKey;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        return null;
    }
    return new ChatGoogleGenerativeAI({
        model: config.Gemini.Model || "gemini-3.6-flash",
        apiKey,
        temperature,
    });
};
/**
 * Initialize Gemini Embeddings Model
 */
export const getEmbeddingModel = () => {
    const apiKey = config.Gemini.ApiKey;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        return null;
    }
    return new GoogleGenerativeAIEmbeddings({
        model: config.Gemini.EmbeddingModel || "gemini-embedding-2",
        apiKey,
    });
};
/**
 * Perform comprehensive ATS and career analysis on resume text
 */
export const analyzeResumeWithAi = async (rawText, fileName = "Resume.pdf") => {
    const model = getChatModel(0.2);
    if (model) {
        try {
            const prompt = `
You are an expert AI Resume Analyst, Technical Recruiter, and Applicant Tracking System (ATS) Specialist.
Analyze the following resume thoroughly and return ONLY a valid JSON response without any markdown wrappers or text outside the JSON.

Resume File Name: "${fileName}"
Resume Text:
"""
${rawText.slice(0, 10000)}
"""

Please evaluate the resume and output JSON strictly adhering to this schema:
{
  "atsScore": <number between 0 and 100 representing overall ATS pass score>,
  "atsGrade": <"Excellent" if >= 85, "Good" if 70-84, "Average" if 55-69, "Needs Improvement" if < 55>,
  "summary": <string: 2-3 sentences summarizing candidate's background, key domain, and strengths>,
  "categoryScores": {
    "formatting": <number 0-100: evaluation of readability, clear headings, consistency>,
    "keywordOptimization": <number 0-100: density of industry relevant keywords and terminology>,
    "experienceImpact": <number 0-100: use of quantifiable metrics, action verbs, and results>,
    "skillsRelevance": <number 0-100: modern tools and technical/soft skills depth>,
    "structureReadability": <number 0-100: overall flow, bullet point clarity, concise length>
  },
  "strengths": [
    <string: strength 1>,
    <string: strength 2>,
    <string: strength 3>,
    <string: strength 4>
  ],
  "weaknesses": [
    <string: weakness/gap 1>,
    <string: weakness/gap 2>,
    <string: weakness/gap 3>
  ],
  "actionableRecommendations": [
    <string: specific actionable recommendation to increase ATS score 1>,
    <string: specific actionable recommendation 2>,
    <string: specific actionable recommendation 3>,
    <string: specific actionable recommendation 4>
  ],
  "targetJobRoles": [
    <string: job title 1 best matching this resume>,
    <string: job title 2>,
    <string: job title 3>,
    <string: job title 4>
  ],
  "extractedSkills": {
    "technical": [<string: technical skill 1>, <string: technical skill 2>, ...],
    "soft": [<string: soft skill 1>, <string: soft skill 2>, ...],
    "tools": [<string: tool/framework 1>, <string: tool/framework 2>, ...]
  },
  "missingKeywords": [
    <string: high-value missing industry keyword 1>,
    <string: missing keyword 2>,
    <string: missing keyword 3>
  ],
  "experienceLevel": <"Entry-Level" | "Mid-Level" | "Senior" | "Lead / Executive">
}
`;
            const response = await model.invoke(prompt);
            let responseText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
            // Clean up any markdown code block fences if present
            responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsedJson = JSON.parse(responseText);
            parsedJson.analyzedAt = new Date();
            return parsedJson;
        }
        catch (error) {
            console.error("⚠️ Gemini AI ATS analysis encountered an error, using intelligent parser fallback:", error.message);
        }
    }
    // Heuristic analysis fallback (ensures offline reliability, instant response, and testing support)
    return generateHeuristicAnalysis(rawText, fileName);
};
/**
 * Intelligent local ATS heuristic analyzer (fallback when API key is unconfigured or during offline test)
 */
export const generateHeuristicAnalysis = (rawText, _fileName = "Resume.pdf") => {
    const lower = rawText.toLowerCase();
    // 1. Detect technical skills
    const commonTech = [
        "javascript", "typescript", "react", "node.js", "nodejs", "express", "mongodb",
        "python", "java", "c++", "sql", "postgresql", "docker", "kubernetes", "aws",
        "git", "github", "html", "css", "tailwind", "redux", "graphql", "rest api",
        "next.js", "vue", "angular", "ci/cd", "agile", "scrum", "linux", "langchain", "openai"
    ];
    const matchedTech = commonTech.filter((t) => lower.includes(t));
    // 2. Detect soft skills
    const commonSoft = [
        "leadership", "communication", "teamwork", "problem solving", "critical thinking",
        "collaboration", "adaptability", "time management", "mentoring", "agile"
    ];
    const matchedSoft = commonSoft.filter((s) => lower.includes(s));
    // 3. Detect tools
    const commonTools = ["git", "docker", "postman", "jira", "figma", "vscode", "aws", "github actions"];
    const matchedTools = commonTools.filter((t) => lower.includes(t));
    // 4. Metrics & Action Verbs check
    const metricMatches = (rawText.match(/\d+%|\$\d+|\b\d+\s*(users|clients|projects|million|k)\b/gi) || []).length;
    const actionVerbs = ["developed", "built", "implemented", "designed", "optimized", "architected", "managed", "scaled", "led", "created"];
    const matchedVerbs = actionVerbs.filter((v) => lower.includes(v));
    // 5. Compute scores
    const formattingScore = Math.min(95, Math.max(65, 75 + (rawText.length > 500 ? 10 : 0)));
    const keywordScore = Math.min(95, Math.max(50, 45 + matchedTech.length * 4));
    const impactScore = Math.min(95, Math.max(50, 40 + metricMatches * 10 + matchedVerbs.length * 3));
    const skillsScore = Math.min(95, Math.max(55, 50 + matchedTech.length * 3 + matchedSoft.length * 4));
    const structureScore = 80;
    const overallAts = Math.round((formattingScore * 0.2) +
        (keywordScore * 0.25) +
        (impactScore * 0.25) +
        (skillsScore * 0.2) +
        (structureScore * 0.1));
    let atsGrade = "Good";
    if (overallAts >= 85)
        atsGrade = "Excellent";
    else if (overallAts >= 70)
        atsGrade = "Good";
    else if (overallAts >= 55)
        atsGrade = "Average";
    else
        atsGrade = "Needs Improvement";
    // Experience Level
    let experienceLevel = "Mid-Level";
    if (lower.includes("senior") || lower.includes("lead") || lower.includes("architect")) {
        experienceLevel = "Senior";
    }
    else if (lower.includes("intern") || lower.includes("graduate") || lower.includes("junior")) {
        experienceLevel = "Entry-Level";
    }
    return {
        atsScore: overallAts,
        atsGrade,
        summary: `Strong candidate demonstrating hands-on experience in ${matchedTech.slice(0, 4).join(", ") || "software development"} with demonstrated capability in building modern scalable applications.`,
        categoryScores: {
            formatting: formattingScore,
            keywordOptimization: keywordScore,
            experienceImpact: impactScore,
            skillsRelevance: skillsScore,
            structureReadability: structureScore,
        },
        strengths: [
            `Demonstrated proficiency with key technologies: ${matchedTech.slice(0, 5).join(", ") || "core domain stack"}`,
            `Effective utilization of action verbs (${matchedVerbs.slice(0, 4).join(", ") || "built, developed"}) throughout experience descriptions`,
            "Clean structure with easily parseable sections for ATS parsers",
            "Good balance of technical skills and real-world project contributions",
        ],
        weaknesses: [
            metricMatches < 2 ? "Limited quantifiable metrics (e.g., % improvement, scale of users, latency reduction)" : "Could highlight more team leadership and cross-functional accomplishments",
            "Missing explicit certifications or cloud vendor accreditations",
            "Summary section could be sharper and more targeted toward specific target seniority",
        ],
        actionableRecommendations: [
            "Quantify achievements: Use the Google X-Y-Z formula ('Accomplished [X] as measured by [Y], by doing [Z]')",
            "Add high-impact industry keywords (e.g., CI/CD, Microservices, System Design, Unit Testing)",
            "Ensure LinkedIn and GitHub profiles are hyperlinked in contact header",
            "Tailor skills and summary section for each specific target job description",
        ],
        targetJobRoles: [
            "Full Stack Developer",
            "Frontend / React Engineer",
            "Backend Node.js Engineer",
            "Software Development Engineer (SDE-I / SDE-II)",
        ],
        extractedSkills: {
            technical: matchedTech.length > 0 ? matchedTech : ["JavaScript", "TypeScript", "Node.js", "React"],
            soft: matchedSoft.length > 0 ? matchedSoft : ["Communication", "Problem Solving", "Teamwork"],
            tools: matchedTools.length > 0 ? matchedTools : ["Git", "Docker", "Postman", "VS Code"],
        },
        missingKeywords: ["CI/CD Pipeline", "Unit & Integration Testing", "System Architecture", "Performance Tuning"],
        experienceLevel,
        analyzedAt: new Date(),
    };
};
/**
 * Query Resume with Vector Embeddings and LangChain RAG
 * 1. Takes user query & resume text chunks
 * 2. Maps chunks into LangChain Documents and indexes in MemoryVectorStore
 * 3. Creates retriever with k=2 and queries vector embeddings to create 'result' text
 * 4. Passes 'result' context and 'query' to AI model for response
 */
export const queryResumeVectorStore = async (chunks, query, chatHistory = []) => {
    const embeddings = getEmbeddingModel();
    const chatModel = getChatModel(0.4);
    let result = "";
    let relevantChunks = [];
    // 1. Vector Search using MemoryVectorStore if embeddings model is available
    if (embeddings && chunks.length > 0) {
        try {
            const documents = chunks.map((chunk) => new Document({ pageContent: chunk }));
            const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
            const retrieve = vectorStore.asRetriever({
                k: Math.min(2, chunks.length),
            });
            const resultDocs = await retrieve.invoke(query);
            relevantChunks = resultDocs.map((item) => item.pageContent);
            result = relevantChunks.join("\n\n");
        }
        catch (error) {
            console.warn("⚠️ Vector store embedding retrieval warning:", error.message);
        }
    }
    // Fallback: If embeddings didn't run (e.g. offline dev/test), pick relevant chunks by term overlap
    if (relevantChunks.length === 0 && chunks.length > 0) {
        const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
        const scoredChunks = chunks.map((chunk) => {
            const lower = chunk.toLowerCase();
            const score = queryTerms.reduce((acc, term) => acc + (lower.includes(term) ? 1 : 0), 0);
            return { chunk, score };
        });
        scoredChunks.sort((a, b) => b.score - a.score);
        relevantChunks = scoredChunks.slice(0, 2).map((sc) => sc.chunk);
        result = relevantChunks.join("\n\n");
    }
    // 2. Format Chat History Context if available
    const historyText = chatHistory
        .slice(-4)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
    // 3. Generate Answer with AI Chat Model using Context (result) and Question (query)
    if (chatModel) {
        try {
            const prompt = `
You are a helpful career assistant.

Context:
${result || "No specific resume text retrieved."}

${historyText ? `Previous Conversation:\n${historyText}\n\n` : ""}Question:
${query}

Instructions:
- Answer based only on context
- If not found, say "Not available in resume"
- Give short and clear answer (max 100 words)
- And you can give me career advice
`;
            const aiResponse = await chatModel.invoke(prompt);
            const answer = typeof aiResponse.content === "string"
                ? aiResponse.content
                : JSON.stringify(aiResponse.content);
            return {
                answer,
                relevantChunks,
                resultText: result,
            };
        }
        catch (error) {
            console.error("Chat model error, falling back to intelligent response generator:", error.message);
        }
    }
    // Fallback intelligent career assistant response generator
    const fallbackAnswer = generateCareerAssistantResponse(query, result);
    return {
        answer: fallbackAnswer,
        relevantChunks,
        resultText: result,
    };
};
/**
 * Fallback career assistant response generator
 */
function generateCareerAssistantResponse(query, context) {
    const q = query.toLowerCase();
    if (q.includes("job") || q.includes("role") || q.includes("career") || q.includes("apply")) {
        return `Based on your resume, you have solid skills in modern full-stack development.

Here are the best job roles to target:
• **Full Stack Engineer / Developer (MERN / TypeScript)**: Your profile shows direct capability in building web applications.
• **Frontend React Engineer**: Focus on roles emphasizing interactive web apps and responsive UI.
• **Backend Node.js Engineer**: Target teams working on RESTful APIs, microservices, and database design.

**Career Tip**: Focus your applications on tech startups and mid-size companies looking for agile developers who can build end-to-end features quickly!`;
    }
    if (q.includes("improve") || q.includes("ats") || q.includes("score") || q.includes("weakness")) {
        return `Here are key ways to immediately improve your resume and boost your ATS score:

1. **Add Quantifiable Metrics**: Replace general descriptions with numbers (e.g., "Optimized API response time by 30%", "Serving 500+ daily active users").
2. **Include Action Verbs**: Begin every bullet point with verbs like *Architected*, *Engineered*, *Optimized*, or *Deployed*.
3. **Keyword Alignment**: Match terms from target job descriptions such as *CI/CD*, *System Design*, and *Cloud Deployment*.
4. **Clean Formatting**: Maintain consistent bullet styles, standard fonts, and avoid multi-column layouts that confuse older ATS parsers.`;
    }
    if (q.includes("interview") || q.includes("prepare") || q.includes("question")) {
        return `Based on your resume, expect interview questions on:
• **System Design & API Architecture**: Explain how you design REST endpoints and database schemas.
• **State Management & React Performance**: How to handle re-renders, asynchronous data fetching, and security.
• **Project Deep-Dive**: Be ready to talk through the architecture, challenges faced, and trade-offs made in your featured projects.

**Advice**: Use the STAR method (Situation, Task, Action, Result) when answering behavioral and project questions!`;
    }
    return `Based on your resume context:
"${context.slice(0, 200)}..."

You have a strong technical foundation. To take your career to the next level:
• Highlight real-world impact and business results on your projects.
• Build and deploy full-scale AI-powered applications to stand out to modern engineering teams.
• Keep your GitHub and portfolio updated with live demo links!

Feel free to ask for specific advice on interviews, project ideas, or resume bullet improvements.`;
}
