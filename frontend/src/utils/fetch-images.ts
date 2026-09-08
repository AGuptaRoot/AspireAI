/**
 * Fast Local SVG & CSS Image / Primitive Utilities
 *
 * External photo fetching (Unsplash, Flickr, placeholder APIs) is completely
 * disabled to prevent UI blocking and eliminate network latency.
 */

export interface SvgPlaceholderProps {
    width?: number;
    height?: number;
    label?: string;
    bgColor?: string;
    textColor?: string;
}

/**
 * Generate lightweight SVG Data URI instantly without any network call
 */
export function generateSvgPlaceholder({
    width = 400,
    height = 200,
    label = "Preview",
    bgColor = "#1e293b",
    textColor = "#94a3b8",
}: SvgPlaceholderProps = {}): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <rect width="${width}" height="${height}" fill="${bgColor}" rx="8"/>
  <circle cx="${width / 2}" cy="${height / 2 - 12}" r="22" fill="#334155"/>
  <text x="${width / 2}" y="${height / 2 + 32}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${textColor}" text-anchor="middle">${label}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Clean Avatar SVG placeholder with candidate initials
 */
export function getCleanAvatarPlaceholder(initials: string = "AI", color: string = "#6366f1"): string {
    const clean = (initials || "AI").slice(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="40" fill="${color}"/>
  <text x="40" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">${clean}</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Non-blocking instant placeholder fetcher replacing external photo search
 */
export async function fetchImages(query: string, count: number = 1): Promise<string[]> {
    return Array.from({ length: count }, (_, i) =>
        generateSvgPlaceholder({ label: `${query} ${i + 1}` })
    );
}

export const searchPhotos = fetchImages;
export const enrichWithImages = async <T extends Record<string, any>>(data: T): Promise<T> => data;
