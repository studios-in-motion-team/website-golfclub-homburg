export function getSanitizeOptions(level = "default", sanitizeHtmlLib) {
  const base = sanitizeHtmlLib.defaults || {};

  const allowedTags = (sanitizeHtmlLib.defaults?.allowedTags || []).concat([
    "img",
    "figure",
    "figcaption",
    "h1",
    "h2",
    "h3",
  ]);

  const allowedAttributes = {
    ...(sanitizeHtmlLib.defaults?.allowedAttributes || {}),
    img: ["src", "alt", "width", "height"],
    a: ["href", "name", "target", "rel"],
  };

  const opts = {
    allowedTags,
    allowedAttributes,
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        const rel =
          attribs.rel || (href.startsWith("http") ? "noopener noreferrer" : "");
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            target: attribs.target || "_blank",
            rel,
          },
        };
      },
    },
  };

  // Different levels could be expanded later (e.g., 'relaxed', 'strict')
  if (level === "relaxed") {
    // allow additional formatting tags
    opts.allowedTags = opts.allowedTags.concat([
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
    ]);
  }

  return opts;
}
