import React from "react";

interface ResumePaperDocumentProps {
    content: string;
    id?: string;
    className?: string;
}

export const ResumePaperDocument: React.FC<ResumePaperDocumentProps> = ({
    content,
    id = "resume-paper-document",
    className = "",
}) => {
    // Parse markdown lines into structured elements
    const lines = content.split("\n");

    const renderFormattedText = (text: string) => {
        // Simple bold formatting: **bold**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={idx} style={{ fontWeight: 700, color: "#111827" }}>
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            // Handle italics: *italic*
            if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
                return (
                    <em key={idx} style={{ fontStyle: "italic", color: "#4b5563" }}>
                        {part.slice(1, -1)}
                    </em>
                );
            }
            return part;
        });
    };

    return (
        <div
            id={id}
            className={`w-full p-8 sm:p-12 rounded-xl shadow-2xl leading-relaxed max-w-[850px] mx-auto transition-all ${className}`}
            style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                color: "#111827",
                backgroundColor: "#ffffff",
                minHeight: "1050px",
                fontSize: "12px",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {lines.map((line, index) => {
                    const trimmed = line.trim();

                    if (!trimmed) {
                        return <div key={index} style={{ height: "6px" }} />;
                    }

                    // H1 - Candidate Name
                    if (trimmed.startsWith("# ")) {
                        return (
                            <h1
                                key={index}
                                style={{
                                    fontSize: "26px",
                                    fontWeight: 900,
                                    textAlign: "center",
                                    color: "#0f172a",
                                    paddingBottom: "4px",
                                    letterSpacing: "-0.5px",
                                    margin: "0 0 4px 0",
                                }}
                            >
                                {trimmed.replace(/^#\s+/, "")}
                            </h1>
                        );
                    }

                    // H2 - Section Heading
                    if (trimmed.startsWith("## ")) {
                        return (
                            <div key={index} style={{ paddingTop: "10px", marginTop: "4px" }}>
                                <h2
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        letterSpacing: "1px",
                                        color: "#1e293b",
                                        borderBottom: "2px solid #cbd5e1",
                                        paddingBottom: "4px",
                                        margin: "0",
                                    }}
                                >
                                    {trimmed.replace(/^##\s+/, "")}
                                </h2>
                            </div>
                        );
                    }

                    // H3 - Job Title / Degree / Subheading
                    if (trimmed.startsWith("### ")) {
                        return (
                            <h3
                                key={index}
                                style={{
                                    fontSize: "12.5px",
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    paddingTop: "4px",
                                    margin: "0",
                                }}
                            >
                                {renderFormattedText(trimmed.replace(/^###\s+/, ""))}
                            </h3>
                        );
                    }

                    // Bullet Points
                    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        return (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    paddingLeft: "8px",
                                    fontSize: "11.5px",
                                    lineHeight: "1.45",
                                    color: "#374151",
                                }}
                            >
                                <span style={{ color: "#9ca3af", userSelect: "none" }}>•</span>
                                <span style={{ flex: 1 }}>
                                    {renderFormattedText(trimmed.replace(/^[-*]\s+/, ""))}
                                </span>
                            </div>
                        );
                    }

                    // Contact row or subtitle (contains pipe separators or emails)
                    if (trimmed.includes("|") || trimmed.includes("@")) {
                        return (
                            <p
                                key={index}
                                style={{
                                    fontSize: "11px",
                                    textAlign: "center",
                                    color: "#4b5563",
                                    letterSpacing: "0.2px",
                                    fontWeight: 500,
                                    paddingBottom: "4px",
                                    margin: "0",
                                }}
                            >
                                {renderFormattedText(trimmed)}
                            </p>
                        );
                    }

                    // Standard Paragraph / Description
                    return (
                        <p
                            key={index}
                            style={{
                                fontSize: "11.5px",
                                lineHeight: "1.5",
                                color: "#374151",
                                margin: "0 0 4px 0",
                            }}
                        >
                            {renderFormattedText(trimmed)}
                        </p>
                    );
                })}
            </div>
        </div>
    );
};

export default ResumePaperDocument;
