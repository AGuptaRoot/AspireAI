# AspireAI Repository Architecture & Technical Audit Report

> **Repository URL**: `https://github.com/AGuptaRoot/AspireAI.git`  
> **Repository Name**: `AspireAI`  
> **Workspace**: `C:\Users\N\Documents\projects\AspireAIR`  
> **Audit Date**: March 2026  
> **Target Platform**: Full-Stack AI-Powered Resume ATS Evaluator & Career Coaching Application

---

## 1. Executive Summary

**AspireAI** is a modern, full-stack AI-driven career acceleration and Applicant Tracking System (ATS) optimization platform. It bridges the gap between job candidates and modern recruitment algorithms by providing:
1. **Automated Resume PDF Ingestion & Semantic Chunking**: Converts binary PDF documents into structured text and semantic segments.
2. **Comprehensive ATS Compatibility Scoring**: Evaluates resumes on a 0–100 scale across multiple criteria (formatting, keyword optimization, quantifiable metrics impact, and skill relevance).
3. **Retrieval-Augmented Generation (RAG) AI Career Coach**: Utilizes vector embeddings and Google Gemini generative AI to enable contextual conversational mentoring based on the candidate's actual resume data.
4. **End-to-End Secure Candidate Lifecycle**: Account creation with Email OTP verification, JWT session management with refresh tokens, and a complete resume history vault.

The project is structured as a decoupled monorepo containing an **Express 5 + TypeScript** backend and a **React 19 + Vite + Tailwind CSS v4** frontend.

---

## 2. Architecture & Directory Tree

```
AspireAIR/
├── README.md                           # Quick project notes
├── PROJECT_REPORT.md                   # Comprehensive architectural and technical report
│
├── backend/                            # Node.js + Express 5 + TypeScript API
│   ├── package.json                    # Backend dependencies and scripts
│   ├── tsconfig.json                   # TypeScript compiler configuration
│   ├── test-e2e.js                     # 15-step End-to-End test suite
│   ├── dist/                           # Compiled JS output (checked into git)
│   └── src/
│       ├── index.ts                    # Express entrypoint, middlewares & error handling
│       ├── config/
│       │   ├── config.ts               # Environment variables configuration
│       │   └── mongodb_connect.ts      # Mongoose database connection
│       ├── controllers/
│       │   ├── auth.controllers.ts     # User authentication, OTP, JWT refresh & logout
│       │   ├── resume.controllers.ts   # Upload, analyze, analytics, RAG chat endpoints
│       │   └── users.controllers.ts    # User profile and dev testing endpoints
│       ├── middlewares/
│       │   ├── auth.middleware.ts      # JWT Bearer token authentication
│       │   ├── upload.middleware.ts    # Multer memory storage PDF upload handler
│       │   └── validate.middleware.ts  # Zod schema validation middleware
│       ├── models/
│       │   ├── Otp.model.ts            # OTP verification schema with 5-minute MongoDB TTL
│       │   ├── chat.models.ts          # Career coaching conversation history
│       │   ├── resume.models.ts        # Parsed text, chunks, and ATS scoring analysis
│       │   ├── session.models.ts       # Refresh token sessions and device tracking
│       │   └── users.models.ts         # User schema with hashed passwords
│       ├── routes/
│       │   ├── auth.routes.ts          # Public & protected authentication routes
│       │   ├── resume.routes.ts        # Resume management and AI RAG routes
│       │   └── users.routes.ts         # User profile routes
│       ├── schemas/
│       │   └── user.schemas.ts         # Zod schemas for auth input validation
│       ├── services/
│       │   ├── ai.service.ts           # Gemini 3.6 Flash analysis + LangChain MemoryVectorStore RAG
│       │   ├── email.service.ts        # Nodemailer SMTP transporter with dev fallback
│       │   └── resumeParser.service.ts # pdf-parse-new & RecursiveCharacterTextSplitter
│       ├── types/
│       │   └── express.d.ts            # Express Request type extensions (req.user)
│       └── utils/
│           └── generateOtp.ts          # 6-digit cryptographic OTP generator
│
└── frontend/                           # React 19 + Vite 8 + Tailwind CSS v4 SPA
    ├── package.json                    # Frontend dependencies and scripts
    ├── vite.config.js                  # Vite configuration with Tailwind plugin
    ├── index.html                      # HTML entrypoint
    ├── .env                            # Client environment configuration
    └── src/
        ├── main.tsx                    # React root rendering
        ├── App.tsx                     # React Router v7 routes & global auth bootstrapping
        ├── index.css                   # Global styles & Tailwind imports
        ├── types/
        │   └── index.ts                # Shared TypeScript models & interfaces
        ├── services/
        │   └── api.ts                  # Centralized fetch client with automatic token refresh
        ├── store/
        │   └── useAppStore.ts          # Zustand state store (Auth, Resumes, Chat)
        ├── components/
        │   ├── AtsScoreCircle.tsx      # Circular SVG score gauge with dynamic color coding
        │   ├── CareerCoachChat.tsx     # Vector RAG AI conversation interface
        │   ├── Navbar.tsx              # Sticky navigation header with session status
        │   ├── ProtectedRoute.tsx      # Route guard for authenticated areas
        │   ├── ResumeAnalyticsCard.tsx # Detailed ATS scoring, keyword gaps, and suggestions
        │   └── ResumeUploader.tsx      # Drag-and-drop PDF uploader with canvas confetti
        └── pages/
            ├── HomePage.tsx            # Marketing and feature overview landing page
            ├── DashboardPage.tsx       # Main hub: Scanner, AI Chat, and Resume History
            ├── LoginPage.tsx           # User sign-in
            ├── RegisterPage.tsx        # User sign-up
            └── VerifyOtpPage.tsx       # 6-digit OTP verification page
```

---

## 3. Technology Stack Matrix

| Layer | Technologies & Libraries | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19**, **TypeScript 7** | Client-side reactive UI rendering |
| **Build & Bundling** | **Vite 8**, `@tailwindcss/vite` | Ultra-fast HMR and ESM bundling |
| **Styling & Design** | **Tailwind CSS v4**, `lucide-react` | Dark-themed, responsive dashboard design |
| **State Management** | **Zustand 5** | Unified global state (Auth, Resumes, Chat) |
| **Routing** | **React Router v7** (`createBrowserRouter`) | Client-side navigation & route protection |
| **Backend Runtime** | **Node.js** (ES Modules), **Express 5** | RESTful API server with async route handlers |
| **Database & ODM** | **MongoDB**, **Mongoose 9** | Document storage, indexes, TTL auto-expiry |
| **AI & Vector Retrieval** | **Google Gemini 3.6 Flash**, `@google/genai`, `@langchain/core`, `@langchain/google-genai`, `@langchain/classic` | Resume analysis, semantic embeddings (`gemini-embedding-2`), Vector Search |
| **Document Processing** | `pdf-parse-new`, `@langchain/textsplitters` | PDF buffer text extraction and recursive chunking |
| **Security & Auth** | `bcrypt`, `jsonwebtoken`, `cookie-parser`, `zod` | Password hashing, JWT access/refresh tokens, input validation |
| **Mailing Service** | `nodemailer` | SMTP OTP dispatch with development mock fallback |

---

## 4. Key Architectural Highlights & Features

### 4.1. Intelligent Resume Ingestion & Processing Pipeline
1. **Upload & Validation**: Resumes are uploaded as multipart form data via Multer into memory (`5MB` limit, strictly PDF format).
2. **Text Extraction**: Handled via `pdf-parse-new` to retrieve raw unformatted text and metadata.
3. **Semantic Text Chunking**: Chunks are generated using LangChain's `RecursiveCharacterTextSplitter` with `chunkSize = 1000` and `chunkOverlap = 100`.
4. **Dual Analysis Pipeline**:
   - **Gemini AI Mode**: Generates a structured JSON scorecard analyzing ATS score, grading, category breakdown, extracted skills, missing keywords, and role matches.
   - **Local Heuristic Mode**: If the Gemini API key is missing or encounters rate limits, an intelligent local heuristic engine evaluates action verbs, metrics, and technology frequency to ensure uninterrupted operation.

### 4.2. Retrieval-Augmented Generation (RAG) Career Coach
- **Memory Vector Store**: Chunks from the active resume are dynamically mapped to LangChain `Document` instances and indexed using `MemoryVectorStore` with Gemini embeddings (`gemini-embedding-2`).
- **Context Retrieval**: User questions trigger semantic similarity search (`k=2`), fetching the exact paragraphs from the resume.
- **Context-Augmented Prompting**: The retrieved context, previous conversational history, and candidate query are combined into a strict system prompt instructing Gemini to act as a career coach.
- **Context Citations**: The frontend UI displays interactive citations showing the candidate exactly which resume sections were referenced for each answer.

### 4.3. Resilient Authentication Architecture
- **Password Security**: Passwords are salted and hashed using `bcrypt` (10 rounds).
- **OTP Verification with TTL Index**: Otps are hashed with `sha256` and saved to MongoDB with a `300s` TTL index, automatically self-purging expired codes.
- **Dual Token Flow**:
  - `accessToken`: Short-lived (15 minutes), passed via `Authorization: Bearer <token>`.
  - `refreshToken`: Stored in HTTP-only cookie and verified against hashed sessions in MongoDB.
  - Automatic silent refresh implemented in `frontend/src/services/api.ts` upon receiving a `401 Unauthorized`.

---

## 5. End-to-End Verification (`test-e2e.js`)

The repository includes a dedicated test script (`backend/test-e2e.js`) verifying 15 functional steps:
1. `GET /api/health` — Health check
2. `POST /api/auth/register` — Candidate registration
3. Direct DB verification of OTP creation
4. `POST /api/auth/verify-otp` — Account activation & token acquisition
5. `POST /api/auth/login` — Authentication validation
6. `POST /api/resume/upload` — In-memory PDF synthesis, parsing & ATS score calculation
7. `GET /api/resume/latest/analytics` — Detailed category score verification
8. `POST /api/resume/:id/analyze` — Re-analysis triggering
9. `POST /api/resume/chat` — AI career query with vector retrieval
10. `POST /api/resume/query` — Follow-up career advice query
11. `GET /api/resume/chat-history` — Session message persistence verification
12. `DELETE /api/resume/chat-history` — History cleanup
13. `DELETE /api/resume/:id` — Resume deletion cascade
14. `POST /api/auth/logout` — Session revocation
15. Database cleanup of all generated test data

---

## 6. Identified Gaps, Observations & Recommendations

| Item | Area | Observation | Recommendation |
| :---: | :--- | :--- | :--- |
| **1** | **Git Cleanliness** | `backend/dist` is tracked in git. Compiled artifacts should usually not be committed to source control. | Add `dist` to `backend/.gitignore` and run `git rm -r --cached backend/dist`. |
| **2** | **Root Monorepo Scripts** | Root `package.json` is missing; developers must run `npm install` and `npm run dev` in `backend` and `frontend` separately. | Add a root `package.json` with npm workspaces or a `concurrently` script: `"dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\""`. |
| **3** | **Vector Persistence** | Vector embeddings are currently stored in-memory using `MemoryVectorStore` during each query. | For large-scale production, persist vector embeddings directly in **MongoDB Atlas Vector Search** or an external vector database (Pinecone/Milvus). |
| **4** | **Zod Error Handling** | `README.md` noted: *"zod validation tested but error handling getting problem"*. In `validate.middleware.ts`, `error.issues.map(...)` extracts `err.path.slice(1).join(".")`. | When validating non-nested body schemas, `slice(1)` might result in empty field names. Using `err.path.join(".")` or ensuring consistent schema wrapping resolves any issue. |
| **5** | **Environment Files** | `frontend/.env` is tracked in git. | Provide a `frontend/.env.example` and add `.env` to `.gitignore`. |

---

## 7. Setup & Run Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI
- *(Optional)* **Google Gemini API Key**: For live LLM responses (the system has offline fallbacks built-in)

### Step 1: Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/aspire_ai
JWT_SECRET=your_super_secret_jwt_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
```
Run backend in development mode:
```bash
npm run dev
```

### Step 2: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---
*Report generated automatically following complete code inspection and git repository sync.*
