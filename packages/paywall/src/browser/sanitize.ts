const EVENT_HANDLER_RE = /^on/i;

/**
 * Parse an HTML string with DOMParser and strip dangerous content
 * (script/iframe/object/embed elements and inline event-handler attributes)
 * before it is injected into the document via innerHTML.
 */
export function sanitizeHTML(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, "text/html");

  const dangerous = doc.querySelectorAll("script, iframe, object, embed");
  for (const el of dangerous) {
    el.remove();
  }

  const all = doc.querySelectorAll("*");
  for (const el of all) {
    for (const attr of [...el.attributes]) {
      if (EVENT_HANDLER_RE.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }
  }

  return doc.documentElement.innerHTML;
}
