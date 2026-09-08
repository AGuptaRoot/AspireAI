/**
 * Speed-Optimized Image & Icon Utilities (No External HTTP Requests)
 *
 * All external photo queries (Unsplash, Flickr, placeholder services)
 * are completely bypassed and eliminated.
 *
 * Returns instant SVG data URIs, local CSS patterns, and clean icon primitives
 * with ZERO network overhead and zero latency.
 */

export interface ImagePlaceholderOptions {
    width?: number;
    height?: number;
    label?: string;
    bgColor?: string;
    textColor?: string;
    pattern?: "grid" | "dots" | "gradient" | "minimal";
}

/**
 * Generate lightweight SVG Data URI instantly without any external network call
 */
export function generateSvgPlaceholder(options: ImagePlaceholderOptions = {}): string {
    const width = options.width || 400;
    const height = options.height || 200;
    const label = options.label || "Placeholder";
    const bg = options.bgColor || "#1e293b";
    const text = options.textColor || "#94a3b8";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <rect width="${width}" height="${height}" fill="${bg}" rx="8"/>
  <circle cx="${width / 2}" cy="${height / 2 - 14}" r="24" fill="#334155"/>
  <path d="M${width / 2 - 12} ${height / 2 + 18} C${width / 2 - 12} ${height / 2 + 6}, ${width / 2 + 12} ${height / 2 + 6}, ${width / 2 + 12} ${height / 2 + 18}" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  <text x="${width / 2}" y="${height / 2 + 38}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${text}" text-anchor="middle">${label}</text>
</svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate Candidate Avatar SVG instantly
 */
export function getCleanAvatarPlaceholder(initials: string = "AI", color: string = "#6366f1"): string {
    const cleanInitials = (initials || "AI").slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
  <rect width="96" height="96" rx="48" fill="${color}"/>
  <text x="48" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">${cleanInitials}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Completely bypass any external photo searching (Unsplash, Flickr, etc.)
 * Returns immediately without making any HTTP requests.
 */
export async function fetchImages(query: string, count: number = 1): Promise<string[]> {
    // Zero external network delay: return instant local SVG placeholders
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
        results.push(generateSvgPlaceholder({ label: `${query} ${i + 1}` }));
    }
    return results;
}

/**
 * Alias for backward compatibility if code calls searchPhotos or similar
 */
export const searchPhotos = fetchImages;
export const enrichWithImages = async <T extends Record<string, any>>(data: T): Promise<T> => {
    // Non-blocking bypass: return data immediately without pausing for external assets
    return data;
};
