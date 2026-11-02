import "server-only";
import MarkdownIt from "markdown-it";

/**
 * Safe to inject: raw HTML is escaped (html: false) and markdown-it refuses javascript:, vbscript:,
 * file: and data: links.
 */
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const renderToken: NonNullable<MarkdownIt["renderer"]["rules"]["link_open"]> = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options);
const linkOpen = md.renderer.rules.link_open ?? renderToken;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  // Links to other sites open in a new tab, without access to this window.
  if (token && /^https?:\/\//i.test(token.attrGet("href") ?? "")) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return linkOpen(tokens, idx, options, env, self);
};

export const renderMarkdown = (source: string) => md.render(source);

/** Without the wrapping paragraph. */
export const renderInlineMarkdown = (source: string) => md.renderInline(source);

/** HTML rather than Markdown, e.g. a category description. */
export const looksLikeHtml = (source: string) => /^\s*<([a-z][a-z0-9]*)\b[^>]*>/i.test(source);
