import html2pdf from "html2pdf.js";

interface ExportPdfOptions {
    elementId: string;
    fileName: string;
    onStart?: () => void;
    onSuccess?: () => void;
    onError?: (err: Error) => void;
}

export const exportResumeToPdf = async ({
    elementId,
    fileName,
    onStart,
    onSuccess,
    onError,
}: ExportPdfOptions): Promise<boolean> => {
    try {
        onStart?.();

        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Printable element #${elementId} not found in document.`);
        }

        const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, "_") || "Resume";

        // Resolve html2pdf function safely across ESM/CJS bundles
        const html2pdfFn: any = (html2pdf as any).default || html2pdf;
        if (typeof html2pdfFn !== "function") {
            throw new Error("html2pdf library could not be initialized as a function.");
        }

        const opt = {
            margin: [8, 8, 8, 8],
            filename: `${cleanName}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                letterRendering: true,
                onclone: (clonedDoc: Document) => {
                    // Ensure root & body never have oklch
                    clonedDoc.documentElement.style.backgroundColor = "#ffffff";
                    clonedDoc.documentElement.style.color = "#111827";
                    clonedDoc.body.style.backgroundColor = "#ffffff";
                    clonedDoc.body.style.color = "#111827";

                    // Sanitize any element with oklch computed styles
                    const allEls = clonedDoc.querySelectorAll("*");
                    allEls.forEach((node) => {
                        const el = node as HTMLElement;
                        try {
                            const cs = window.getComputedStyle(el);
                            if (cs.backgroundColor && cs.backgroundColor.includes("oklch")) {
                                el.style.backgroundColor = el.id === "resume-paper-document" ? "#ffffff" : "transparent";
                            }
                            if (cs.color && cs.color.includes("oklch")) {
                                el.style.color = "#111827";
                            }
                            if (cs.borderColor && cs.borderColor.includes("oklch")) {
                                el.style.borderColor = "#cbd5e1";
                            }
                        } catch (_) {}
                    });
                },
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        };

        // Execute PDF generation
        await html2pdfFn().set(opt).from(element).save();

        onSuccess?.();
        return true;
    } catch (err: any) {
        console.error("html2pdf generation error:", err);
        onError?.(err instanceof Error ? err : new Error(String(err)));
        return false;
    }
};

/**
 * Fallback / native high-resolution vector print helper
 */
export const printResume = () => {
    window.print();
};
