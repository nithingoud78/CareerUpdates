import { marked, type MarkedOptions } from "marked";

/**
 * Renders markdown to HTML synchronously.
 *
 * marked v18+ defaults to async mode. This wrapper forces synchronous
 * execution so that dangerouslySetInnerHTML receives a real string,
 * not [object Promise].
 */
const markedOptions: MarkedOptions = {
  gfm: true,
  breaks: true,
  async: false,
};

export function renderMarkdown(content: string | null | undefined): string {
  if (!content) return "";

  // marked.parse with async:false always returns string (not Promise)
  const html = marked.parse(content, markedOptions) as string;

  return html;
}
