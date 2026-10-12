/**
 * Allowlist sanitizer for ad descriptions.
 *
 * Descriptions are written in ReactQuill and rendered with
 * dangerouslySetInnerHTML on the public ad page and in the admin panel, but the
 * API accepted any HTML at all, so a request sent outside the form could store
 * <script>, <iframe> or onerror= handlers and run them for every visitor (and
 * for the admin reviewing the ad, whose token sits in a readable cookie).
 *
 * Every tag in the output is rebuilt from scratch: only the tags Quill
 * produces, only ql-* classes and only colour styles. Nothing from the original
 * tag text is copied through, so malformed or nested tricks have nothing to
 * survive in. Any "<" that is not a rebuilt tag is escaped.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "ol", "ul", "li", "h1", "h2", "h3", "span",
]);

const VOID_TAGS = new Set(["br"]);

// Removed together with everything inside them.
const DROP_WITH_CONTENT = [
  "script", "style", "iframe", "object", "embed", "noscript", "template",
  "textarea", "select", "svg", "math", "head", "title", "xmp", "noembed",
  "noframes",
];

const SAFE_CLASS = /^ql-[a-z0-9-]+$/i;
const SAFE_STYLE_PROPS = new Set(["color", "background-color"]);
const SAFE_STYLE_VALUE = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.\s,%]+\)|[a-z]{3,20})$/i;

/**
 * Patterns that a description written in the post form can never contain.
 * Matching one means the request was crafted by hand, which is reason enough
 * to send the ad to review even after the markup has been stripped.
 */
const UNSAFE_HTML_PATTERNS = [
  /<\s*\/?\s*(script|iframe|object|embed|form|svg|math|meta|link|base|style)\b/i,
  /<[^>]*\son[a-z]+\s*=/i,
  /<[^>]*(javascript|vbscript)\s*:/i,
  /<[^>]*data\s*:\s*text\/html/i,
];

const hasUnsafeHtml = (input) =>
  Boolean(input) && UNSAFE_HTML_PATTERNS.some((re) => re.test(String(input)));

const ATTR_RE = /([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

function rebuildAttributes(attrText) {
  let className = "";
  let style = "";

  for (const m of attrText.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";

    if (name === "class") {
      className = value
        .split(/\s+/)
        .filter((c) => SAFE_CLASS.test(c))
        .join(" ");
    } else if (name === "style") {
      style = value
        .split(";")
        .map((decl) => {
          const [prop, ...rest] = decl.split(":");
          const p = (prop || "").trim().toLowerCase();
          const v = rest.join(":").trim();
          return SAFE_STYLE_PROPS.has(p) && SAFE_STYLE_VALUE.test(v)
            ? `${p}: ${v}`
            : null;
        })
        .filter(Boolean)
        .join("; ");
    }
  }

  return (
    (className ? ` class="${className}"` : "") +
    (style ? ` style="${style};"` : "")
  );
}

function sanitizeHtml(input) {
  if (!input) return "";
  let html = String(input).replace(/<!--[\s\S]*?(?:-->|$)/g, "");

  for (const tag of DROP_WITH_CONTENT) {
    html = html.replace(
      new RegExp(`<\\s*${tag}\\b[\\s\\S]*?(?:<\\s*\\/\\s*${tag}\\s*>|$)`, "gi"),
      ""
    );
  }

  return html
    .split(/(<[^>]*>?)/)
    .map((token) => {
      if (!token.startsWith("<")) return token.replace(/>/g, "&gt;");

      const m = token.match(/^<\s*(\/)?\s*([a-z][a-z0-9]*)\b([^>]*)>$/i);
      if (!m) return token.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const closing = Boolean(m[1]);
      const tag = m[2].toLowerCase();
      // Disallowed tags are unwrapped: the tag goes, its text stays. Links are
      // already stripped on the ad page for SEO, so <a> is treated the same.
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
      return `<${tag}${rebuildAttributes(m[3])}>`;
    })
    .join("");
}

module.exports = { sanitizeHtml, hasUnsafeHtml };
