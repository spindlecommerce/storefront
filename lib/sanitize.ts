import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Descriptions from the API are written by staff but still cleaned before they are injected: no
 * scripts, styles, event handlers or javascript: URLs.
 */
export const sanitize = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2", "figure", "figcaption", "picture", "source"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "title", "width", "height", "loading"],
      source: ["srcset", "sizes", "type", "media"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
      }),
    },
  });
