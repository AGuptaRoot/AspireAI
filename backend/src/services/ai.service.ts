import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { config } from "../config/config.js";
import { IResumeAnalysis } from "../models/resume.models.js";
import { IChatMessage } from "../models/chat.models.js";

/**
 * Initialize Gemini Chat Model
 */
export const getChatModel = (temperature: number = 0.4) => {
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
export const analyzeResumeWithAi = async (
    rawText: string,
    fileName: string = "Resume.pdf"
): Promise<IResumeAnalysis> => {
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

            const parsedJson: IResumeAnalysis = JSON.parse(responseText);
            parsedJson.analyzedAt = new Date();
            return parsedJson;
        } catch (error: any) {
            console.error("⚠️ Gemini AI ATS analysis encountered an error, using intelligent parser fallback:", error.message);
        }
    }

    // Heuristic analysis fallback (ensures offline reliability, instant response, and testing support)
    return generateHeuristicAnalysis(rawText, fileName);
};

/**
 * Intelligent local ATS heuristic analyzer (fallback when API key is unconfigured or during offline test)
 */
export const generateHeuristicAnalysis = (rawText: string, _fileName: string = "Resume.pdf"): IResumeAnalysis => {
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

    const overallAts = Math.round(
        (formattingScore * 0.2) +
        (keywordScore * 0.25) +
        (impactScore * 0.25) +
        (skillsScore * 0.2) +
        (structureScore * 0.1)
    );

    let atsGrade: "Excellent" | "Good" | "Average" | "Needs Improvement" = "Good";
    if (overallAts >= 85) atsGrade = "Excellent";
    else if (overallAts >= 70) atsGrade = "Good";
    else if (overallAts >= 55) atsGrade = "Average";
    else atsGrade = "Needs Improvement";

    // Experience Level
    let experienceLevel: "Entry-Level" | "Mid-Level" | "Senior" | "Lead / Executive" = "Mid-Level";
    if (lower.includes("senior") || lower.includes("lead") || lower.includes("architect")) {
        experienceLevel = "Senior";
    } else if (lower.includes("intern") || lower.includes("graduate") || lower.includes("junior")) {
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
export const queryResumeVectorStore = async (
    chunks: string[],
    query: string,
    chatHistory: IChatMessage[] = []
): Promise<{ answer: string; relevantChunks: string[]; resultText: string }> => {
    const embeddings = getEmbeddingModel();
    const chatModel = getChatModel(0.4);

    let result = "";
    let relevantChunks: string[] = [];

    // 1. Vector Search using MemoryVectorStore if embeddings model is available
    if (embeddings && chunks.length > 0) {
        try {
            const documents = chunks.map(
                (chunk) => new Document({ pageContent: chunk })
            );

            const vectorStore = await MemoryVectorStore.fromDocuments(
                documents,
                embeddings
            );

            const retrieve = vectorStore.asRetriever({
                k: Math.min(2, chunks.length),
            });

            const resultDocs = await retrieve.invoke(query);
            relevantChunks = resultDocs.map((item) => item.pageContent);
            result = relevantChunks.join("\n\n");
        } catch (error: any) {
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
        } catch (error: any) {
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
function generateCareerAssistantResponse(query: string, context: string): string {
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

export interface GeneratedMcqQuestion {
    questionId: number;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
}

/**
 * Generate 10 MCQ Questions for AI Interviewer based on candidate's field
 */
export const generateMcqQuestionsForField = async (
    field: string,
    difficulty: "Junior" | "Mid-Level" | "Senior" = "Mid-Level",
    resumeContext: string = ""
): Promise<GeneratedMcqQuestion[]> => {
    const chatModel = getChatModel(0.3);

    if (chatModel) {
        try {
            const prompt = `
You are a senior technical interviewer and engineering manager specializing in "${field}".
Generate exactly 10 high quality Multiple Choice Questions (MCQs) for a ${difficulty} interview in the field of "${field}".
${resumeContext ? `Candidate Background Context: "${resumeContext.slice(0, 1200)}"` : ""}

Requirements:
1. Exactly 10 questions numbered 1 to 10.
2. Questions must test practical concepts, debugging, architecture, best practices, and real-world scenarios in ${field}.
3. Exactly 4 distinct options per question.
4. Exactly one correct answer denoted by a 0-based index (0, 1, 2, or 3).
5. A concise 1-2 sentence explanation of why the correct answer is accurate.
6. Return ONLY valid JSON as an array of objects matching this exact schema:
[
  {
    "questionId": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Why Option A is correct."
  }
]
`;

            const aiResponse = await chatModel.invoke(prompt);
            let responseText = typeof aiResponse.content === "string" 
                ? aiResponse.content 
                : JSON.stringify(aiResponse.content);

            responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

            const parsed: any[] = JSON.parse(responseText);
            if (Array.isArray(parsed) && parsed.length >= 8) {
                return parsed.slice(0, 10).map((item, idx) => ({
                    questionId: idx + 1,
                    question: String(item.question),
                    options: Array.isArray(item.options) ? item.options.map(String).slice(0, 4) : ["Option A", "Option B", "Option C", "Option D"],
                    correctOptionIndex: typeof item.correctOptionIndex === "number" && item.correctOptionIndex >= 0 && item.correctOptionIndex <= 3 ? item.correctOptionIndex : 0,
                    explanation: String(item.explanation || "Correct based on modern engineering standards."),
                }));
            }
        } catch (error: any) {
            console.warn("⚠️ AI Question generation encountered an error, using intelligent field bank fallback:", error.message);
        }
    }

    // Heuristic Bank Fallback tailored to the candidate's field
    return generateHeuristicInterviewQuestions(field, difficulty);
};

/**
 * Intelligent field-specific MCQ Question Generator (fallback for offline or unconfigured API key)
 */
export const generateHeuristicInterviewQuestions = (
    field: string,
    _difficulty: string = "Mid-Level"
): GeneratedMcqQuestion[] => {
    const f = field.toLowerCase();

    // 1. Frontend / React
    if (f.includes("front") || f.includes("react") || f.includes("ui") || f.includes("web developer")) {
        return [
            {
                questionId: 1,
                question: "What is the primary benefit of React's Virtual DOM reconciliation process?",
                options: [
                    "It bypasses all browser DOM repainting entirely",
                    "It minimizes costly direct DOM mutations by batching and calculating diffs",
                    "It executes JavaScript in a separate Web Worker thread",
                    "It converts JSX directly into web assembly bytecode"
                ],
                correctOptionIndex: 1,
                explanation: "The Virtual DOM computes minimum diffs and updates only changed elements in the real DOM, optimizing rendering performance."
            },
            {
                questionId: 2,
                question: "Which React hook is designed to memoize the result of an expensive calculation between renders?",
                options: ["useCallback", "useMemo", "useRef", "useEffect"],
                correctOptionIndex: 1,
                explanation: "useMemo caches the calculated value of a function and only recalculates it when dependencies change."
            },
            {
                questionId: 3,
                question: "What does the CSS 'box-sizing: border-box;' rule do?",
                options: [
                    "Removes all padding and margins from the element",
                    "Includes padding and border in the element's total width and height calculation",
                    "Forces the element to display as an inline block",
                    "Adds an automatic drop shadow to the border"
                ],
                correctOptionIndex: 1,
                explanation: "With border-box, the width and height properties include content, padding, and border, simplifying layout sizing."
            },
            {
                questionId: 4,
                question: "In JavaScript, what is the key difference between '==' and '==='?",
                options: [
                    "'==' performs type coercion before comparison, whereas '===' strictly checks value and type",
                    "'===' is only valid for objects and arrays",
                    "'==' checks memory address references, while '===' checks values",
                    "There is no functional difference in modern ES6+"
                ],
                correctOptionIndex: 0,
                explanation: "The strict equality operator (===) checks both value and type without performing automatic type coercion."
            },
            {
                questionId: 5,
                question: "Why should you avoid using array indices as keys in React lists?",
                options: [
                    "React will throw an unrecoverable syntax error",
                    "Reordering or deleting items can cause incorrect component state and render bugs",
                    "Indices consume double memory in the Virtual DOM",
                    "Keys must always be alphanumeric strings"
                ],
                correctOptionIndex: 1,
                explanation: "Using array indices as keys confuses React's reconciler if items are reordered, filtered, or prepended, leading to state persistence bugs."
            },
            {
                questionId: 6,
                question: "What is the primary purpose of the 'useEffect' cleanup function in React?",
                options: [
                    "To delete the component's state variables from memory",
                    "To cancel subscriptions, clear timers, or clean up side effects before unmounting or re-running",
                    "To trigger a compulsory re-render of child components",
                    "To reset form input elements"
                ],
                correctOptionIndex: 1,
                explanation: "The return callback in useEffect runs when the component unmounts or before the effect runs again, preventing memory leaks."
            },
            {
                questionId: 7,
                question: "What is Event Bubbling in the browser DOM?",
                options: [
                    "Events fire asynchronously only after all scripts have finished executing",
                    "Events propagate from the target element upwards through its ancestor tree in the DOM",
                    "Events trigger animation transitions automatically",
                    "Events are captured at the window level and cancelled before reaching elements"
                ],
                correctOptionIndex: 1,
                explanation: "Event bubbling is the phase where an event triggers on the deepest target element and then bubbles up through its ancestors."
            },
            {
                questionId: 8,
                question: "Which HTTP status code signifies that a requested resource was successfully created on the server?",
                options: ["200 OK", "201 Created", "204 No Content", "304 Not Modified"],
                correctOptionIndex: 1,
                explanation: "HTTP 201 Created is the standard response sent following a successful POST request creating a new resource."
            },
            {
                questionId: 9,
                question: "What is the primary purpose of code-splitting via React.lazy() and Suspense?",
                options: [
                    "To encrypt JavaScript bundle files before network transfer",
                    "To load component bundles on-demand, reducing initial bundle size and page load time",
                    "To run React components server-side without a Node.js runtime",
                    "To enable multi-threading in React state updates"
                ],
                correctOptionIndex: 1,
                explanation: "Code splitting delays loading non-critical JavaScript chunks until they are needed, drastically improving First Contentful Paint."
            },
            {
                questionId: 10,
                question: "What is the function of a Content Security Policy (CSP) header?",
                options: [
                    "To enforce HTTPS encryption across all subdomains",
                    "To mitigate Cross-Site Scripting (XSS) and data injection attacks by restricting resource origins",
                    "To compress HTML and image payloads",
                    "To authenticate API tokens"
                ],
                correctOptionIndex: 1,
                explanation: "CSP headers define approved sources of executable scripts, stylesheets, and images, defending against XSS attacks."
            }
        ];
    }

    // 2. Backend / Node.js / Database / API
    if (f.includes("back") || f.includes("node") || f.includes("api") || f.includes("database") || f.includes("express")) {
        return [
            {
                questionId: 1,
                question: "In Node.js, how does the Event Loop handle asynchronous non-blocking I/O operations?",
                options: [
                    "By spawning a brand new OS process for every incoming HTTP request",
                    "By delegating I/O tasks to libuv worker thread pools and executing callbacks in event loop phases",
                    "By pausing the main JavaScript thread until disk or network I/O completes",
                    "By compiling asynchronous code to multi-threaded C++ classes"
                ],
                correctOptionIndex: 1,
                explanation: "Node.js runs single-threaded JavaScript while leveraging libuv's underlying C++ thread pool for asynchronous I/O handling."
            },
            {
                questionId: 2,
                question: "What is the main purpose of database indexing (e.g. in MongoDB or PostgreSQL)?",
                options: [
                    "To compress the physical size of database tables",
                    "To drastically speed up document retrieval queries at the cost of slight write overhead",
                    "To encrypt sensitive database column values",
                    "To prevent concurrent read operations"
                ],
                correctOptionIndex: 1,
                explanation: "Indexes store sorted pointers to documents, allowing the query planner to perform fast binary searches instead of full collection scans."
            },
            {
                questionId: 3,
                question: "Why should refresh tokens be stored in HTTP-Only, Secure cookies rather than localStorage?",
                options: [
                    "localStorage has a 5KB storage limit",
                    "HTTP-Only cookies cannot be read or stolen by malicious client-side JavaScript (mitigating XSS)",
                    "Cookies load faster than localStorage in modern browsers",
                    "localStorage is automatically cleared when the browser tab closes"
                ],
                correctOptionIndex: 1,
                explanation: "The httpOnly flag prevents client JavaScript from accessing the token, protecting against token theft via XSS vulnerabilities."
            },
            {
                questionId: 4,
                question: "What does the ACID acronym stand for in relational database transactions?",
                options: [
                    "Access, Control, Integrity, Durability",
                    "Atomicity, Consistency, Isolation, Durability",
                    "Authentication, Concurrency, Indexing, Delivery",
                    "Asynchronous, Compressed, Isolated, Decoupled"
                ],
                correctOptionIndex: 1,
                explanation: "ACID represents Atomicity (all or nothing), Consistency, Isolation (independent transactions), and Durability (permanence)."
            },
            {
                questionId: 5,
                question: "What is an Idempotent HTTP method in RESTful API design?",
                options: [
                    "A method that can only be invoked by authenticated administrators",
                    "A method that produces the exact same server state regardless of whether called once or multiple times",
                    "A method that never returns an HTTP error code",
                    "A method that streams response data in real-time"
                ],
                correctOptionIndex: 1,
                explanation: "Methods like GET, PUT, and DELETE are idempotent because executing them multiple times results in the same resource state."
            },
            {
                questionId: 6,
                question: "Which Express middleware pattern correctly catches unhandled errors and sends a JSON response?",
                options: [
                    "(req, res, next) => { ... }",
                    "(err, req, res, next) => { res.status(500).json({ error: err.message }); }",
                    "(req, res) => { try {} catch(e) {} }",
                    "(err, res) => { res.send(err); }"
                ],
                correctOptionIndex: 1,
                explanation: "Express error-handling middleware must take exactly 4 parameters: (err, req, res, next)."
            },
            {
                questionId: 7,
                question: "What is the primary function of a reverse proxy like NGINX in front of a Node.js API?",
                options: [
                    "To compile TypeScript files into JavaScript before request execution",
                    "To provide SSL termination, load balancing, static file caching, and DDoS mitigation",
                    "To generate automatic database migrations",
                    "To enforce React component rendering"
                ],
                correctOptionIndex: 1,
                explanation: "NGINX offloads SSL encryption, distributes traffic across application instances, and caches static assets efficiently."
            },
            {
                questionId: 8,
                question: "What is the purpose of connection pooling in database drivers?",
                options: [
                    "To execute queries in parallel across multiple geographic regions",
                    "To reuse open TCP connections rather than opening and closing a new socket connection per request",
                    "To synchronize database tables with Redis caches",
                    "To encrypt database passwords"
                ],
                correctOptionIndex: 1,
                explanation: "Establishing TCP and database handshakes is expensive; connection pools maintain active connections for immediate reuse."
            },
            {
                questionId: 9,
                question: "What is the time complexity of looking up a value in a hash map with good hashing distribution?",
                options: ["O(n)", "O(log n)", "O(1) average time", "O(n^2)"],
                correctOptionIndex: 2,
                explanation: "Hash table lookups compute an array index directly from the hash key, giving O(1) constant average lookup time."
            },
            {
                questionId: 10,
                question: "In microservices architecture, what is the role of the Circuit Breaker pattern?",
                options: [
                    "To enforce single sign-on authentication",
                    "To stop cascading system failures by temporarily halting requests to an unhealthy downstream service",
                    "To automatically scale Docker container instances",
                    "To run database backups every midnight"
                ],
                correctOptionIndex: 1,
                explanation: "Circuit breakers prevent an application from repeatedly calling a failing service, allowing the failing service time to recover."
            }
        ];
    }

    // 3. Full Stack / Default
    return [
        {
            questionId: 1,
            question: "In modern full-stack web applications, what is the primary purpose of CORS (Cross-Origin Resource Sharing)?",
            options: [
                "To speed up REST API response latency across CDNs",
                "To instruct browsers whether to permit web pages to make requests to a domain different from their own origin",
                "To encrypt JSON request payloads with asymmetric public keys",
                "To synchronize MongoDB collections with frontend state"
            ],
            correctOptionIndex: 1,
            explanation: "CORS is a browser security mechanism that uses HTTP headers to tell browsers if a web app can access resources from a different origin."
        },
        {
            questionId: 2,
            question: "Which of the following describes the difference between SQL (Relational) and NoSQL (Document) databases?",
            options: [
                "SQL databases do not support indexes, while NoSQL databases require indexes for all queries",
                "SQL databases enforce strict relational schemas and ACID transactions, whereas NoSQL offers flexible schemas and horizontal scalability",
                "NoSQL databases cannot store numbers or booleans",
                "SQL databases can only run on Linux servers"
            ],
            correctOptionIndex: 1,
            explanation: "Relational SQL databases use structured tables and joins, while NoSQL (like MongoDB) stores flexible JSON-like documents ideal for rapid scaling."
        },
        {
            questionId: 3,
            question: "What information is typically encoded in the payload of a JSON Web Token (JWT)?",
            options: [
                "The user's raw unhashed database password",
                "User claims and identifiers (e.g., user ID, roles, expiration timestamp)",
                "The server's private cryptographic secret key",
                "Complete database query results"
            ],
            correctOptionIndex: 1,
            explanation: "JWT payloads contain claims (like user ID and expiry) encoded in base64url. Sensitive secrets or raw passwords should never be stored here."
        },
        {
            questionId: 4,
            question: "In React, what is the difference between controlled and uncontrolled form inputs?",
            options: [
                "Controlled components have their form data handled by React state, while uncontrolled components rely on DOM refs",
                "Controlled components can only accept string values",
                "Uncontrolled components cannot trigger submit events",
                "Controlled components only work on desktop browsers"
            ],
            correctOptionIndex: 0,
            explanation: "In controlled components, input values are bound to React state via value and onChange handlers, ensuring a single source of truth."
        },
        {
            questionId: 5,
            question: "What is the difference between Process and Thread in operating systems?",
            options: [
                "A thread has its own isolated memory space, whereas processes share memory",
                "A process is an executing program with its own memory space, whereas threads are smaller execution units sharing the process memory",
                "Processes run only on CPU, while threads run on GPU",
                "Threads cannot run concurrently"
            ],
            correctOptionIndex: 1,
            explanation: "Processes have separate virtual memory allocations; threads exist within a process and share its code, data, and memory resources."
        },
        {
            questionId: 6,
            question: "What does the HTTP header 'Cache-Control: no-cache' instruct the client or CDN to do?",
            options: [
                "Never store the response in any cache whatsoever",
                "Submit the request to the origin server for validation (e.g. ETag) before releasing a cached copy",
                "Delete all browser cookies immediately",
                "Cache the response indefinitely for 1 year"
            ],
            correctOptionIndex: 1,
            explanation: "'no-cache' means the cache must revalidate with the origin server before serving the cached copy; 'no-store' forbids caching entirely."
        },
        {
            questionId: 7,
            question: "Why are cryptographic salt values used when hashing passwords with bcrypt?",
            options: [
                "To shorten the final length of the password string",
                "To defend against rainbow table attacks by ensuring identical passwords yield distinct hash outputs",
                "To enable reversible decryption of the password during password reset",
                "To compress the database storage size"
            ],
            correctOptionIndex: 1,
            explanation: "A salt is random data added to the password before hashing, guaranteeing that two identical passwords produce completely different hashes."
        },
        {
            questionId: 8,
            question: "In asynchronous JavaScript, what does 'Promise.all()' do when one of the promises rejects?",
            options: [
                "It waits for all other promises to resolve and returns partial results",
                "It immediately rejects with the error of that first rejected promise",
                "It retries the rejected promise 3 times automatically",
                "It converts the rejection into null"
            ],
            correctOptionIndex: 1,
            explanation: "Promise.all() has fail-fast behavior: if any single input promise rejects, the entire returned promise immediately rejects."
        },
        {
            questionId: 9,
            question: "In full-stack application deployment, what is the main purpose of containerization with Docker?",
            options: [
                "To replace operating systems with virtual memory cards",
                "To package an application with its exact dependencies, ensuring consistent behavior across all environments",
                "To automatically generate frontend UI components",
                "To eliminate the need for databases"
            ],
            correctOptionIndex: 1,
            explanation: "Docker containers package code and system dependencies together, eliminating the 'it works on my machine' issue."
        },
        {
            questionId: 10,
            question: "In RAG (Retrieval-Augmented Generation) systems, what role do vector embeddings play?",
            options: [
                "They render 3D graphics on web pages using WebGL",
                "They represent text chunks as high-dimensional numerical vectors to allow semantic similarity search",
                "They compress PDF files into zip archives",
                "They execute SQL transactions inside AI models"
            ],
            correctOptionIndex: 1,
            explanation: "Vector embeddings encode semantic meaning into coordinate spaces, enabling cosine distance searches for the most relevant context."
        }
    ];
};

/**
 * Generate an AI-crafted, ATS-optimized Resume in Markdown based on old resume or profile
 */
export const generateResumeWithAi = async ({
    existingResumeText,
    targetRole = "Full Stack Developer",
    userName = "Candidate",
    userEmail = "candidate@example.com",
    customInstructions = "",
}: {
    existingResumeText?: string;
    targetRole?: string;
    userName?: string;
    userEmail?: string;
    customInstructions?: string;
}): Promise<string> => {
    const model = getChatModel(0.3);

    if (model) {
        try {
            const prompt = `
You are an elite Executive Career Strategist, Technical Recruiter, and ATS Optimization Specialist.
Your task is to write a comprehensive, highly persuasive, modern ATS-optimized resume in standard Markdown format for:

Target Role: "${targetRole}"
Candidate Name: "${userName}"
Candidate Email: "${userEmail}"
${customInstructions ? `Special Instructions / Custom Focus: "${customInstructions}"` : ""}

${
    existingResumeText && existingResumeText.trim().length > 50
        ? `Use and enhance the candidate's existing background, projects, skills, and experience from their previous resume below. Keep factual information consistent while dramatically elevating phrasing, action verbs, and quantifiable impact:
"""
${existingResumeText.slice(0, 8000)}
"""`
        : `Generate an exemplary, highly detailed, realistic resume profile tailored for a top-tier ${targetRole}. Include industry-standard technical depth and achievements.`
}

CRITICAL RESUME FORMATTING INSTRUCTIONS:
1. Output ONLY clean Markdown text. Do NOT wrap in triple backticks (\`\`\`markdown or \`\`\`).
2. Follow this standard professional structure:

# ${userName}
${userEmail} | +1 (555) 234-5678 | San Francisco, CA | linkedin.com/in/${userName.toLowerCase().replace(/\s+/g, "")} | github.com/${userName.toLowerCase().replace(/\s+/g, "")}

## Professional Summary
[A compelling 3-4 sentence elevator pitch highlighting quantifiable achievements, core architectural expertise, and tailored value for ${targetRole}].

## Technical Core Competencies
- **Languages**: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
- **Frameworks & Libraries**: React, Next.js, Node.js, Express, Tailwind CSS, Redux Toolkit
- **Cloud & DevOps**: AWS (S3, Lambda, EC2), Docker, Kubernetes, GitHub Actions, CI/CD Pipelines
- **Databases & Architecture**: MongoDB, PostgreSQL, Redis, Microservices, RESTful APIs, GraphQL, System Design

## Professional Work Experience
### Senior ${targetRole} | TechNova Solutions
*San Francisco, CA | Jan 2023 – Present*
- Architected and deployed microservices-based web applications, reducing API response latency by 38% for over 250,000 monthly active users.
- Spearheaded migration of legacy monolith to modular TypeScript and React architecture, boosting development velocity by 40%.
- Integrated automated CI/CD deployment pipelines using Docker and GitHub Actions, slashing release cycle time from 3 hours to 15 minutes.
- Mentored a squad of 6 junior and mid-level engineers, enforcing strict code review quality standards and unit test coverage above 85%.

### Software Engineer | Vertex Digital Systems
*San Francisco, CA | Jun 2021 – Dec 2022*
- Developed responsive, accessible frontend interfaces in React and Tailwind CSS, improving user conversion rates by 22%.
- Designed and maintained high-throughput RESTful endpoints using Express and MongoDB with optimized index schemes.
- Implemented Redis caching layers, decreasing heavy database load by 45% during peak seasonal traffic.

## Key Engineering Projects
### AspireAI – Career Growth & ATS Platform | React, Node.js, LangChain, MongoDB
- Designed and built an end-to-end AI career platform featuring vector RAG embeddings, ATS resume scoring, and mock interviews.
- Integrated Google Gemini AI models for real-time semantic analysis and personalized interview evaluation.

### CloudScale – Distributed Task Orchestrator | TypeScript, Go, Docker, Redis
- Implemented a distributed background job queue capable of processing over 10,000 asynchronous jobs per minute with retry mechanisms.

## Education
### Bachelor of Science in Computer Science
University of California, Berkeley | 2017 – 2021
- Relevant Coursework: Data Structures & Algorithms, Distributed Systems, Database Management, Operating Systems

## Certifications & Awards
- AWS Certified Solutions Architect – Associate
- Certified Kubernetes Application Developer (CKAD)
`;

            const response = await model.invoke(prompt);
            const content = response.content?.toString() || "";
            return content.replace(/^```markdown\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
        } catch (err: any) {
            console.error("Gemini AI resume generation error, falling back to heuristic builder:", err.message);
        }
    }

    // Fallback heuristic generator
    return generateFallbackResume(targetRole, userName, userEmail, existingResumeText);
};

/**
 * Fallback heuristic resume generator when Gemini is not configured or offline
 */
export const generateFallbackResume = (
    targetRole: string = "Full Stack Developer",
    userName: string = "Candidate",
    userEmail: string = "candidate@example.com",
    existingText?: string
): string => {
    const safeName = userName || "Candidate Name";
    const safeEmail = userEmail || "candidate@example.com";
    const handle = safeName.toLowerCase().replace(/\s+/g, "");

    return `# ${safeName}
${safeEmail} | +1 (555) 234-5678 | San Francisco, CA | linkedin.com/in/${handle} | github.com/${handle}

## Professional Summary
Dynamic, results-driven ${targetRole} with proven expertise in architecting, developing, and deploying resilient web applications. Recognized for combining solid software engineering best practices with modern cloud and AI technologies to drive measurable business outcomes, optimize system performance, and elevate user experience.

## Technical Core Competencies
- **Languages**: TypeScript, JavaScript (ES6+), Python, SQL, HTML5, CSS3
- **Frameworks & Libraries**: React 19, Next.js, Node.js, Express, Tailwind CSS, Zustand, Redux
- **Cloud & DevOps**: AWS, Docker, Kubernetes, CI/CD Pipelines, GitHub Actions, Nginx
- **Databases & Architecture**: MongoDB, PostgreSQL, Redis, RESTful APIs, GraphQL, Microservices, System Design

## Professional Work Experience
### Senior ${targetRole} | CloudVanguard Technologies
*San Francisco, CA | Jan 2023 – Present*
- Architected and delivered modern scalable web applications using TypeScript, React, and Node.js, improving system throughput by 42%.
- Designed and implemented caching strategies using Redis and MongoDB indexes, cutting median query latency from 220ms to 45ms.
- Built automated continuous integration and continuous deployment (CI/CD) pipelines with Docker, accelerating release frequency by 3x.
- Collaborated cross-functionally with product and design leads to refine product roadmaps and implement accessibility standards.

### Software Engineer | Apex Digital Solutions
*San Jose, CA | Jul 2021 – Dec 2022*
- Developed responsive client-facing interfaces in React and Tailwind CSS, increasing candidate onboarding completion by 28%.
- Built secure, authenticated REST APIs using Express, JWT tokens, and role-based access control (RBAC).
- Integrated third-party APIs and webhooks, ensuring 99.9% uptime and reliable background job handling.

## Key Engineering Projects
### Full-Stack AI Career Acceleration Platform | React, TypeScript, LangChain, MongoDB
- Engineered an end-to-end ATS evaluation and AI technical interviewer platform with vector search and automated test generation.
- Implemented real-time scoring algorithms, 5-minute timed rounds, and interactive scorecard analytics.

### Enterprise Real-time Analytics Dashboard | React, Node.js, WebSockets, PostgreSQL
- Created interactive data visualization dashboards streaming live telemetry metrics with sub-second latency.

## Education
### Bachelor of Science in Computer Science
University of Technology | 2017 – 2021
- Core coursework: Data Structures, Algorithms, Distributed Systems, Software Engineering, Database Systems

## Certifications & Achievements
- AWS Certified Developer – Associate
- Meta Front-End Developer Professional Certificate
`;
};

/**
 * Assist with AI Resume Editing, Rewriting, and Bullet Polish for BlockNote XL-AI
 */
export const assistResumeWritingWithAi = async (params: {
    prompt?: string;
    selectedText?: string;
    contextText?: string;
    targetRole?: string;
    action?: "improve" | "xyz" | "concise" | "roleAlign" | "grammar" | "custom";
}): Promise<string> => {
    const { prompt, selectedText, contextText, targetRole, action = "improve" } = params;

    let instruction = "";
    switch (action) {
        case "xyz":
            instruction = "Rewrite the provided resume bullet point(s) strictly using Google's X-Y-Z formula ('Accomplished [X] as measured by [Y], by doing [Z]'). Include clear quantified metrics, percentage improvements, or dollar/time savings.";
            break;
        case "concise":
            instruction = "Make the text more punchy and concise, removing filler words while preserving key technical skills, metrics, and high-impact action verbs.";
            break;
        case "roleAlign":
            instruction = `Optimize the wording specifically for a competitive candidate applying for a '${targetRole || "Senior Engineer"}' position. Highlight relevant technical competencies and leadership.`;
            break;
        case "grammar":
            instruction = "Correct any grammatical errors, passive voice, or awkward phrasing while maintaining professional resume tone.";
            break;
        case "improve":
        default:
            instruction = prompt
                ? `Follow this specific instruction: "${prompt}". Improve the resume text accordingly.`
                : "Improve this resume bullet or section to sound senior, impactful, and ATS-optimized, starting with powerful action verbs.";
            break;
    }

    const model = getChatModel(0.3);
    if (model) {
        try {
            const systemPrompt = `You are an elite Silicon Valley executive resume editor and career strategist.
Your task is to refine and rewrite resume content to maximize impact, ATS score, and recruiter appeal.

Rules:
1. Return ONLY the rewritten text/markdown. Do NOT include pleasantries, quotes, explanations, or introductory text (e.g. no "Here is the revised version:").
2. Preserve markdown structure (e.g. bullet points '-', headings '#', bolding '**').
3. Keep the candidate's core accomplishments factual while significantly elevating phrasing, clarity, and metric impact.`;

            const fullPrompt = `${systemPrompt}

Instruction: ${instruction}
${targetRole ? `Target Role: ${targetRole}` : ""}
${contextText ? `Surrounding Resume Context:\n${contextText.slice(0, 1500)}` : ""}

Text to rewrite:
"""
${selectedText || prompt || "Experienced engineer developing high-scale systems."}
"""

Rewritten text:`;

            const response = await model.invoke(fullPrompt);
            const text = response.content?.toString()?.trim() || "";
            if (text) {
                return text.replace(/^```markdown\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
            }
        } catch (err: any) {
            console.warn("AI assist write error, using heuristic fallback:", err.message);
        }
    }

    // Heuristic fallback
    if (selectedText) {
        if (action === "xyz") {
            return `- Delivered ${selectedText.replace(/^[-*]\s*/, "")}, resulting in a 35% efficiency increase by implementing streamlined automated workflows.`;
        }
        if (action === "concise") {
            return selectedText.replace(/responsible for/gi, "Led").replace(/worked on/gi, "Built").trim();
        }
        return `Spearheaded ${selectedText.replace(/^[-*]\s*/, "")}, driving a 25% increase in operational throughput and system reliability.`;
    }
    return `Engineered high-performance components for ${targetRole || "Software Engineer"}, reducing response latency by 30% across distributed microservices.`;
};

