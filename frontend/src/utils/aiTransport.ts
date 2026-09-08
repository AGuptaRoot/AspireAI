import { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { api, getAuthToken } from "../services/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export class BlockNoteAiResumeTransport implements ChatTransport<any> {
    private targetRole: string;

    constructor(targetRole: string = "Full Stack Engineer") {
        this.targetRole = targetRole;
    }

    public setTargetRole(role: string) {
        this.targetRole = role;
    }

    async reconnectToStream(): Promise<ReadableStream<UIMessageChunk>> {
        return new ReadableStream<UIMessageChunk>({
            start(controller) {
                controller.close();
            },
        });
    }

    async sendMessages(options: {
        messages: any[];
        abortSignal?: AbortSignal;
        body?: any;
    }): Promise<ReadableStream<UIMessageChunk>> {
        const lastMsg = options.messages[options.messages.length - 1];
        let promptText = "";
        if (lastMsg) {
            if (typeof lastMsg.content === "string") {
                promptText = lastMsg.content;
            } else if (Array.isArray(lastMsg.parts)) {
                promptText = lastMsg.parts
                    .map((p: any) => (typeof p === "string" ? p : p.text || JSON.stringify(p)))
                    .join(" ");
            } else if (Array.isArray(lastMsg.content)) {
                promptText = lastMsg.content
                    .map((c: any) => (typeof c === "string" ? c : c.text || JSON.stringify(c)))
                    .join(" ");
            } else {
                promptText = JSON.stringify(lastMsg.content || lastMsg);
            }
        }

        const msgId = `ai-chunk-${Date.now()}`;
        const targetRole = this.targetRole;

        return new ReadableStream<UIMessageChunk>({
            async start(controller) {
                controller.enqueue({ type: "text-start", id: msgId } as any);

                try {
                    const token = getAuthToken();
                    const headers: Record<string, string> = {
                        "Content-Type": "application/json",
                    };
                    if (token) headers["Authorization"] = `Bearer ${token}`;

                    const response = await fetch(`${BACKEND_URL}/api/builder/ai-write/stream`, {
                        method: "POST",
                        headers,
                        credentials: "include",
                        signal: options.abortSignal,
                        body: JSON.stringify({
                            prompt: promptText,
                            targetRole,
                            action: "custom",
                        }),
                    });

                    if (response.ok && response.body) {
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        let buffer = "";

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split("\n\n");
                            buffer = lines.pop() || "";

                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (trimmed.startsWith("data: ")) {
                                    try {
                                        const parsed = JSON.parse(trimmed.slice(6));
                                        if (parsed.chunk) {
                                            controller.enqueue({
                                                type: "text-delta",
                                                text: parsed.chunk,
                                                id: msgId,
                                            } as any);
                                        }
                                    } catch {
                                        // Ignore malformed partial chunks
                                    }
                                }
                            }
                        }
                    } else {
                        // Fallback to non-streaming endpoint
                        const res = await api.builder.aiWrite({
                            prompt: promptText,
                            targetRole,
                            action: "custom",
                        });
                        const rewritten = res.data?.rewrittenText || promptText;
                        controller.enqueue({
                            type: "text-delta",
                            text: rewritten,
                            id: msgId,
                        } as any);
                    }
                } catch (err: any) {
                    console.warn("BlockNote AI Write streaming fallback:", err);
                    controller.enqueue({
                        type: "text-delta",
                        text: promptText || "Spearheaded high-impact technical initiatives, increasing system throughput by 35%.",
                        id: msgId,
                    } as any);
                } finally {
                    controller.enqueue({ type: "text-end", id: msgId } as any);
                    controller.close();
                }
            },
        });
    }
}
