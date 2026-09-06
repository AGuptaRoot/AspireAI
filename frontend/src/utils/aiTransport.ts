import { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { api } from "../services/api";

export class BlockNoteAiResumeTransport implements ChatTransport<UIMessage> {
    private targetRole: string;

    constructor(targetRole: string = "Full Stack Engineer") {
        this.targetRole = targetRole;
    }

    public setTargetRole(role: string) {
        this.targetRole = role;
    }

    async sendMessages(options: {
        messages: UIMessage[];
        abortSignal?: AbortSignal;
        body?: any;
    }): Promise<ReadableStream<UIMessageChunk>> {
        const lastMsg = options.messages[options.messages.length - 1];
        let promptText = "";
        if (lastMsg) {
            if (typeof lastMsg.content === "string") {
                promptText = lastMsg.content;
            } else if (Array.isArray(lastMsg.content)) {
                promptText = (lastMsg.content as any[])
                    .map((c) => (typeof c === "string" ? c : c.text || JSON.stringify(c)))
                    .join(" ");
            } else {
                promptText = JSON.stringify(lastMsg.content);
            }
        }

        let rewritten = "";
        try {
            const res = await api.builder.aiWrite({
                prompt: promptText,
                targetRole: this.targetRole,
                action: "custom",
            });
            rewritten = res.data?.rewrittenText || promptText;
        } catch (err: any) {
            console.warn("BlockNote AI Write transport fallback:", err);
            rewritten = promptText || "Spearheaded high-impact technical initiatives, increasing system throughput by 35%.";
        }

        const msgId = `ai-chunk-${Date.now()}`;
        return new ReadableStream<UIMessageChunk>({
            start(controller) {
                controller.enqueue({ type: "text-start", id: msgId } as any);
                controller.enqueue({ type: "text-delta", text: rewritten, id: msgId } as any);
                controller.enqueue({ type: "text-end", id: msgId } as any);
                controller.close();
            },
        });
    }
}
