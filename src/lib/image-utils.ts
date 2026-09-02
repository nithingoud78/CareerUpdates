/**
 * Safely resolves a preview image URL.
 * Handles both absolute external URLs (http:// or https://)
 * and relative Supabase storage paths in the 'career-tools' bucket.
 */
export function resolvePreviewImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  // Use the secure API proxy for private bucket previews
  return `/api/preview-image?path=${encodeURIComponent(value)}`;
}
