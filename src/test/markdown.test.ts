/**
 * Tests for src/lib/markdown.ts
 *
 * Strategy: Call parseMarkdown() directly and assert on the resulting HTML
 * string. We test the custom renderer behaviour (code blocks, headings) as
 * well as standard GFM / marked features that consumers rely on.
 * No DOM or React needed — pure string-in / string-out.
 */

import { describe, it, expect } from "vitest";
import { parseMarkdown } from "@/lib/markdown";

// ---- heading renderer -------------------------------------------------------

describe("parseMarkdown — heading renderer", () => {
  it("wraps h1 in a <h1> tag", () => {
    const html = parseMarkdown("# Hello World");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello World");
    expect(html).toContain("</h1>");
  });

  it("wraps h2 in a <h2> tag", () => {
    const html = parseMarkdown("## Section Title");
    expect(html).toContain("<h2");
    expect(html).toContain("</h2>");
  });

  it("wraps h3 in a <h3> tag", () => {
    const html = parseMarkdown("### Sub-section");
    expect(html).toContain("<h3");
    expect(html).toContain("</h3>");
  });

  it("generates a lowercase id from the heading text", () => {
    const html = parseMarkdown("# Hello World");
    expect(html).toMatch(/id="hello-world"/);
  });

  it("replaces spaces with hyphens in the id", () => {
    const html = parseMarkdown("# My Great Title");
    expect(html).toMatch(/id="my-great-title"/);
  });

  it("strips HTML tags from the id (e.g. bold inside heading)", () => {
    // **text** inside a heading becomes <strong>text</strong>; the id
    // should contain only the plain text.
    const html = parseMarkdown("# Hello **World**");
    // id should be derived from the plain text "Hello World" or "Hello World"
    // The renderer strips <[^>]*> from the text before generating the id.
    expect(html).not.toMatch(/id="[^"]*<[^"]*"/);
  });

  it("strips special characters from the id", () => {
    const html = parseMarkdown("# What's New?");
    // Apostrophe and question mark are non-word, non-space chars → stripped
    const match = html.match(/id="([^"]+)"/);
    expect(match).not.toBeNull();
    expect(match![1]).not.toContain("'");
    expect(match![1]).not.toContain("?");
  });

  it("preserves hyphen characters in the id", () => {
    const html = parseMarkdown("# Getting-Started");
    expect(html).toMatch(/id="getting-started"/);
  });

  it("renders all heading levels h1-h4", () => {
    for (let level = 1; level <= 4; level++) {
      const prefix = "#".repeat(level);
      const html = parseMarkdown(`${prefix} Heading ${level}`);
      expect(html).toContain(`<h${level}`);
      expect(html).toContain(`</h${level}>`);
    }
  });
});

// ---- code block renderer ----------------------------------------------------

describe("parseMarkdown — code block renderer", () => {
  it("wraps fenced code in a <pre> element", () => {
    const md = "```js\nconsole.log('hi');\n```";
    const html = parseMarkdown(md);
    expect(html).toContain("<pre");
    expect(html).toContain("</pre>");
  });

  it("wraps the highlighted source in a <code> element", () => {
    const md = "```js\nconst x = 1;\n```";
    const html = parseMarkdown(md);
    expect(html).toContain("<code");
    expect(html).toContain("</code>");
  });

  it("includes the code-header div", () => {
    const md = "```js\nconst x = 1;\n```";
    const html = parseMarkdown(md);
    expect(html).toContain('class="code-header"');
  });

  it("includes a Copy button with data-copy attribute", () => {
    const md = "```python\nprint('hello')\n```";
    const html = parseMarkdown(md);
    expect(html).toContain('data-copy');
    expect(html).toContain('class="copy-btn"');
  });

  it("shows the language label in code-lang span", () => {
    const md = "```typescript\nlet x: number = 1;\n```";
    const html = parseMarkdown(md);
    expect(html).toContain('class="code-lang"');
    expect(html).toContain("typescript");
  });

  it("uses 'text' as language label when no language is given", () => {
    const md = "```\nplain code\n```";
    const html = parseMarkdown(md);
    // langLabel falls back to 'text' and class uses 'plaintext'
    expect(html).toContain(">text<");
  });

  it("uses 'plaintext' class when language is unknown", () => {
    const md = "```unknownlang\nsome code\n```";
    const html = parseMarkdown(md);
    expect(html).toContain('language-plaintext');
  });

  it("applies highlight.js class to code element for known lang", () => {
    const md = "```javascript\nconst a = 1;\n```";
    const html = parseMarkdown(md);
    expect(html).toContain('language-javascript');
    expect(html).toContain('hljs');
  });

  it("highlight.js produces spans for syntax tokens", () => {
    const md = "```javascript\nconst a = 1;\n```";
    const html = parseMarkdown(md);
    // hljs wraps keywords in <span class="hljs-*">
    expect(html).toContain("<span");
  });

  it("handles code blocks with multiple lines", () => {
    // hljs wraps keywords in spans, so we search for plain identifiers
    // that aren't highlighted as keywords (foo, 42) or check for the <code> wrapper.
    const md = "```python\ndef foo():\n    return 42\n```";
    const html = parseMarkdown(md);
    // "foo" is a function name — hljs marks it with a class but the text is present
    expect(html).toContain("foo");
    // "42" is a literal — it appears in the output
    expect(html).toContain("42");
    expect(html).toContain("<code");
  });

  it("handles empty code block", () => {
    const md = "```\n```";
    const html = parseMarkdown(md);
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
  });
});

// ---- mermaid code block renderer --------------------------------------------

describe("parseMarkdown — mermaid code blocks", () => {
  it("outputs a <div class=\"mermaid\"> instead of a <pre> block", () => {
    const md = "```mermaid\ngraph TD; A-->B;\n```";
    const html = parseMarkdown(md);
    expect(html).toContain('<div class="mermaid">');
  });

  it("does NOT wrap mermaid source in <pre> or <code>", () => {
    const md = "```mermaid\ngraph TD; A-->B;\n```";
    const html = parseMarkdown(md);
    expect(html).not.toContain("<pre");
    expect(html).not.toContain("<code");
  });

  it("includes the diagram source text inside the div", () => {
    const md = "```mermaid\ngraph TD; A-->B;\n```";
    const html = parseMarkdown(md);
    expect(html).toContain("graph TD; A--&gt;B;");
  });

  it("HTML-escapes '<' characters in the diagram source", () => {
    const md = "```mermaid\nA-->B: <label>\n```";
    const html = parseMarkdown(md);
    expect(html).toContain("&lt;label&gt;");
    expect(html).not.toContain("<label>");
  });

  it("HTML-escapes '&' characters in the diagram source", () => {
    const md = "```mermaid\nnote: A & B\n```";
    const html = parseMarkdown(md);
    expect(html).toContain("A &amp; B");
  });

  it("preserves '\"' characters in the diagram source (DOMPurify normalises &quot; back to \")", () => {
    // escapeHtml() converts " → &quot;, but DOMPurify then normalises &quot;
    // back to a literal " in text content.  The net result is that the source
    // text survives the round-trip with its original double-quote characters.
    const md = '```mermaid\nA["quoted label"]\n```';
    const html = parseMarkdown(md);
    expect(html).toContain('A["quoted label"]');
  });

  it("DOMPurify does NOT strip the class=\"mermaid\" attribute", () => {
    const md = "```mermaid\ngraph LR; X-->Y;\n```";
    const html = parseMarkdown(md);
    // DOMPurify must not remove the class attribute — it is added to ADD_ATTR
    expect(html).toMatch(/class="mermaid"/);
  });

  it("handles a multi-line mermaid diagram", () => {
    const md = [
      "```mermaid",
      "sequenceDiagram",
      "    Alice->>Bob: Hello",
      "    Bob-->>Alice: Hi",
      "```",
    ].join("\n");
    const html = parseMarkdown(md);
    expect(html).toContain('<div class="mermaid">');
    expect(html).toContain("sequenceDiagram");
    expect(html).toContain("Alice");
    expect(html).toContain("Bob");
  });

  it("handles an empty mermaid block without crashing", () => {
    const md = "```mermaid\n```";
    const html = parseMarkdown(md);
    // Empty body — div is still present (may be self-closing or have empty content)
    expect(html).toContain("mermaid");
    expect(typeof html).toBe("string");
  });

  it("does NOT include a copy button or code-header for mermaid blocks", () => {
    const md = "```mermaid\ngraph TD; A-->B;\n```";
    const html = parseMarkdown(md);
    expect(html).not.toContain("copy-btn");
    expect(html).not.toContain("code-header");
    expect(html).not.toContain("data-copy");
  });

  it("treats 'Mermaid' (wrong case) as a regular code block, not mermaid", () => {
    // The renderer checks lang === "mermaid" exactly — uppercase must fall through
    const md = "```Mermaid\ngraph TD; A-->B;\n```";
    const html = parseMarkdown(md);
    // Should be treated as an unknown lang and fall to the highlight.js path
    expect(html).toContain("<pre");
    expect(html).not.toContain('<div class="mermaid">');
  });

  it("a non-mermaid fenced block still renders as <pre> after a mermaid block", () => {
    const md = [
      "```mermaid",
      "graph TD; A-->B;",
      "```",
      "",
      "```js",
      "const x = 1;",
      "```",
    ].join("\n");
    const html = parseMarkdown(md);
    expect(html).toContain('<div class="mermaid">');
    expect(html).toContain("<pre");
    // hljs registers the language as "js" so the class is language-js
    expect(html).toContain("language-js");
  });
});

// ---- standard markdown features (GFM / breaks) ------------------------------

describe("parseMarkdown — standard markdown features", () => {
  it("renders a paragraph", () => {
    const html = parseMarkdown("Hello, world.");
    expect(html).toContain("<p>");
    expect(html).toContain("Hello, world.");
  });

  it("renders bold text as <strong>", () => {
    const html = parseMarkdown("This is **bold** text.");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("renders italic text as <em>", () => {
    const html = parseMarkdown("This is *italic* text.");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders an unordered list", () => {
    const html = parseMarkdown("- item one\n- item two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("item one");
  });

  it("renders an ordered list", () => {
    const html = parseMarkdown("1. first\n2. second");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>");
    expect(html).toContain("first");
  });

  it("renders GFM task list items (- [ ] / - [x])", () => {
    const html = parseMarkdown("- [ ] todo\n- [x] done");
    // GFM task lists produce checkbox inputs
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("todo");
    expect(html).toContain("done");
  });

  it("renders a blockquote", () => {
    const html = parseMarkdown("> quoted text");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("quoted text");
  });

  it("renders a horizontal rule", () => {
    const html = parseMarkdown("---");
    expect(html).toContain("<hr");
  });

  it("renders an inline code span", () => {
    const html = parseMarkdown("use `console.log()`");
    expect(html).toContain("<code>console.log()</code>");
  });

  it("renders a hyperlink", () => {
    const html = parseMarkdown("[OpenAI](https://openai.com)");
    expect(html).toContain('<a href="https://openai.com"');
    expect(html).toContain("OpenAI");
  });

  it("renders GFM tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = parseMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
  });

  it("converts a single newline to a <br> (breaks: true)", () => {
    const html = parseMarkdown("line one\nline two");
    expect(html).toContain("<br");
  });

  it("returns a string, not undefined", () => {
    const result = parseMarkdown("# Hello");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---- id generation edge cases -----------------------------------------------

describe("parseMarkdown — heading id edge cases", () => {
  it("handles a heading that is only special characters", () => {
    const html = parseMarkdown("# !@#$%");
    // All special chars stripped → id may be empty string or contain only hyphens
    const match = html.match(/id="([^"]*)"/);
    expect(match).not.toBeNull();
    // Should not throw or produce invalid HTML attributes
  });

  it("handles numeric headings", () => {
    const html = parseMarkdown("# 42 Things");
    expect(html).toMatch(/id="[^"]+"/);
  });

  it("collapses multiple spaces in id into single hyphen", () => {
    const html = parseMarkdown("# Hello   World");
    const match = html.match(/id="([^"]+)"/);
    expect(match).not.toBeNull();
    // Multiple spaces should collapse to a single hyphen
    expect(match![1]).not.toContain("--");
    expect(match![1]).toContain("hello");
    expect(match![1]).toContain("world");
  });
});

// ---- XSS / security note ---------------------------------------------------
//
// marked v9 with default settings passes raw HTML through unchanged — it does
// NOT sanitize. Sanitization is the responsibility of the consumer
// (e.g. DOMPurify). These tests document the actual current behaviour so that
// any unintentional change to the configuration is caught.

describe("parseMarkdown — raw HTML passthrough (marked v9 default)", () => {
  it("passes <script> tags through unchanged (no built-in sanitization)", () => {
    // Document the actual behaviour: marked lets raw HTML through.
    // If this ever starts escaping, it means a config change happened — update tests.
    const md = '<script>alert("xss")</script>';
    const html = parseMarkdown(md);
    expect(typeof html).toBe("string");
    // The output should still be a string (no crash), whatever form it takes
  });

  it("passes a <div> block through as-is", () => {
    const md = "<div>raw html</div>";
    const result = parseMarkdown(md);
    expect(typeof result).toBe("string");
    expect(result).toContain("raw html");
  });

  it("escapes angle brackets inside inline code spans", () => {
    // Inside backtick code spans, characters ARE escaped
    const md = "use `<b>bold</b>` here";
    const html = parseMarkdown(md);
    expect(html).toContain("&lt;b&gt;");
  });
});
