import pdf from "pdf-parse-new";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ParsedResumeResult {
    rawText: string;
    pageCount: number;
    totalChunks: number;
    chunks: string[];
    metadata: Record<string, any>;
}

/**
 * Parse PDF Buffer, extract raw text, and split into semantic chunks
 */
export const parsePdfBuffer = async (
    pdfBuffer: Buffer,
    chunkSize: number = 1000,
    chunkOverlap: number = 100
): Promise<ParsedResumeResult> => {
    try {
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("PDF buffer is empty or invalid");
        }

        // 1. Extract text and metadata using pdf-parse-new
        const pdfData = await (typeof (pdf as any).default === "function"
            ? (pdf as any).default(pdfBuffer)
            : (pdf as any)(pdfBuffer));

        const rawText = (pdfData.text || "").trim();

        if (!rawText || rawText.length === 0) {
            throw new Error(
                "Could not extract any readable text from the uploaded PDF. Please ensure the PDF is not an image-only scan or encrypted."
            );
        }

        // 2. Split text using RecursiveCharacterTextSplitter
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
            separators: ["\n\n", "\n", " ", ""],
        });

        const chunks = await splitter.splitText(rawText);

        return {
            rawText,
            pageCount: pdfData.numpages || 1,
            totalChunks: chunks.length,
            chunks,
            metadata: {
                numPages: pdfData.numpages,
                info: pdfData.info || {},
                version: pdfData.version,
            },
        };
    } catch (error: any) {
        console.error("❌ PDF Parsing error:", error);
        throw new Error(error.message || "Failed to parse PDF document");
    }
};
