import { describe, it, expect } from "vitest";
import { protectedPageHtml } from "../../src/views/protected.js";

describe("protectedPageHtml", () => {
  it("renders without a home URL — nav brand is a span, not a link", () => {
    const html = protectedPageHtml();
    expect(html).toContain("Content Unlocked");
    expect(html).toContain('<span class="nav-link">');
  });

  it("renders a valid https home URL as a link", () => {
    const html = protectedPageHtml("https://example.com");
    expect(html).toContain('href="https://example.com"');
  });

  it("renders a relative path as a link", () => {
    const html = protectedPageHtml("/home");
    expect(html).toContain('href="/home"');
  });

  // regression: protocol-relative URLs must be rejected
  it("rejects protocol-relative URLs (//evil.com)", () => {
    const html = protectedPageHtml("//evil.com");
    expect(html).not.toContain("evil.com");
    // nav brand should fall back to a span, not a link
    expect(html).toContain('<span class="nav-link">');
  });

  it("rejects javascript: URLs", () => {
    const html = protectedPageHtml("javascript:alert(1)");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<span class="nav-link">');
  });

  it("rejects data: URLs", () => {
    const html = protectedPageHtml("data:text/html,<h1>hi</h1>");
    expect(html).not.toContain('href="data:');
    expect(html).toContain('<span class="nav-link">');
  });

  it("HTML-escapes special characters in the URL", () => {
    const html = protectedPageHtml('https://example.com/foo&bar="baz"');
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).not.toContain('href="https://example.com/foo&bar="baz""');
  });
});
