/**
 * HTML Sanitization Configuration for Freeda CMS Content
 * 
 * This configuration defines which HTML tags and attributes are allowed
 * when displaying content from the Freeda CMS. This prevents XSS attacks
 * while allowing rich text formatting.
 */

/**
 * Get sanitization options for different security levels
 * 
 * @param {string} level - Security level: 'default', 'strict', or 'relaxed'
 * @param {object} sanitizeHtmlLib - The sanitize-html library instance
 * @returns {object} Sanitization options
 */
export function getSanitizeOptions(level = "default", sanitizeHtmlLib) {
  // Base allowed tags from sanitize-html defaults
  const baseTags = sanitizeHtmlLib.defaults?.allowedTags || [
    'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr',
    'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th',
    'td', 'pre'
  ];

  // Additional tags for news content
  const allowedTags = baseTags.concat([
    "img",
    "figure", 
    "figcaption",
    "h1",
    "h2",
    "span",
    "mark",
    "sub",
    "sup"
  ]);

  // Base allowed attributes
  const baseAttributes = sanitizeHtmlLib.defaults?.allowedAttributes || {};
  
  const allowedAttributes = {
    ...baseAttributes,
    img: ["src", "alt", "width", "height", "title", "class"],
    a: ["href", "name", "target", "rel", "title"],
    div: ["class"],
    span: ["class"],
    figure: ["class"],
    figcaption: ["class"],
    p: ["class"],
    h1: ["class"],
    h2: ["class"],
    h3: ["class"],
    h4: ["class"],
    h5: ["class"],
    h6: ["class"]
  };

  // Base configuration
  const opts = {
    allowedTags,
    allowedAttributes,
    
    // Allowed URL schemes for different tags
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      a: ["http", "https", "mailto", "tel"]
    },
    
    // Disallow certain classes that could be used for styling attacks
    allowedClasses: {
      '*': ['text-*', 'font-*', 'mb-*', 'mt-*', 'p-*', 'm-*']
    },
    
    // Transform tags to add security measures
    transformTags: {
      // Make external links safe
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        const isExternal = href.startsWith("http") && 
                          !href.includes(process.env.VITE_SITEMAP_DOMAIN || '');
        
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            target: isExternal ? "_blank" : (attribs.target || "_self"),
            rel: isExternal ? "noopener noreferrer" : (attribs.rel || "")
          }
        };
      },
      
      // Ensure images have alt text for accessibility
      img: (tagName, attribs) => {
        return {
          tagName: "img",
          attribs: {
            ...attribs,
            alt: attribs.alt || "Bild",
            loading: "lazy" // Add lazy loading
          }
        };
      }
    },
    
    // Remove empty tags that might be used for spacing
    exclusiveFilter: function(frame) {
      const tag = frame.tag;
      const text = frame.text;
      
      // Remove empty paragraphs and divs
      if ((tag === 'p' || tag === 'div') && !text.trim()) {
        return false;
      }
      
      return true;
    }
  };

  // Adjust settings based on security level
  switch (level) {
    case "strict":
      // Minimal tags for high-security contexts
      opts.allowedTags = ["p", "br", "strong", "em", "a"];
      opts.allowedAttributes = {
        a: ["href", "rel"]
      };
      break;
      
    case "relaxed":
      // Additional tags for rich content
      opts.allowedTags = opts.allowedTags.concat([
        "table", "thead", "tbody", "tr", "td", "th",
        "video", "audio", "source",
        "blockquote", "cite",
        "dl", "dt", "dd"
      ]);
      
      opts.allowedAttributes = {
        ...opts.allowedAttributes,
        table: ["class"],
        thead: ["class"],
        tbody: ["class"],
        tr: ["class"],
        td: ["class", "colspan", "rowspan"],
        th: ["class", "colspan", "rowspan", "scope"],
        video: ["src", "width", "height", "controls", "preload"],
        audio: ["src", "controls", "preload"],
        source: ["src", "type"],
        blockquote: ["cite", "class"],
        cite: ["class"]
      };
      
      opts.allowedSchemesByTag = {
        ...opts.allowedSchemesByTag,
        video: ["http", "https"],
        audio: ["http", "https"],
        source: ["http", "https"]
      };
      break;
      
    case "default":
    default:
      // Use base configuration (already set above)
      break;
  }

  return opts;
}

/**
 * Predefined sanitization presets for common use cases
 */
export const PRESETS = {
  // For news article content
  ARTICLE: "default",
  
  // For news teasers/summaries
  TEASER: "strict",
  
  // For rich editorial content
  EDITORIAL: "relaxed"
};

/**
 * Quick sanitize function with preset
 * 
 * @param {string} html - HTML content to sanitize
 * @param {string} preset - Preset name from PRESETS
 * @param {object} sanitizeHtml - sanitize-html library instance
 * @returns {string} Sanitized HTML
 */
export function sanitizeWithPreset(html, preset = PRESETS.ARTICLE, sanitizeHtml) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  const options = getSanitizeOptions(preset, sanitizeHtml);
  return sanitizeHtml(html, options);
}

export default { 
  getSanitizeOptions, 
  PRESETS, 
  sanitizeWithPreset 
};