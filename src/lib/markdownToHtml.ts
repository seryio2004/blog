import { remark } from "remark";
import html from "remark-html";
import hljs from "highlight.js";
import { visit } from "unist-util-visit";
import type { Code } from "mdast";
import type { Locale } from "./i18n";
import { withBasePath } from "./paths";

const languageAliases = new Map([["dotenv", "ini"], ["fstab", "plaintext"]]);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function renderCodeBlock(node: Code, locale: Locale) {
  const language = node.lang?.toLowerCase() || "text";
  const grammar = languageAliases.get(language) ?? language;
  const value = hljs.getLanguage(grammar)
    ? hljs.highlight(node.value, { language: grammar, ignoreIllegals: true }).value
    : escapeHtml(node.value);
  const text = locale === "es"
    ? { plain: "Texto", code: "Código", copy: "Copiar", aria: "Copiar bloque de código" }
    : { plain: "Text", code: "Code", copy: "Copy", aria: "Copy code block" };
  const label = !node.lang ? text.code : ["text", "plaintext", "txt"].includes(language) ? text.plain : language;

  return `<div data-code-block>
    <div data-code-toolbar>
      <span data-code-language>${escapeHtml(label)}</span>
      <button type="button" data-code-copy hidden aria-label="${escapeHtml(`${text.aria}: ${label}`)}">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M12 7V3H3v9h4"/></svg>
        <span data-copy-label aria-live="polite">${text.copy}</span>
      </button>
    </div>
    <pre tabindex="0"><code class="hljs">${value}</code></pre>
  </div>`;
}

export default async function markdownToHtml(markdown: string, locale: Locale = "es") {
  const blocks: Code[] = [];
  const result = await remark()
    .use(() => (tree) => { visit(tree, "code", (node) => { blocks.push(node); }); })
    .use(html)
    .process(markdown);
  let blockIndex = 0;
  return result
    .toString()
    .replace(
      /\b(src|href)="(\/(?!\/)[^"]*)"/g,
      (_match, attribute: string, path: string) =>
        `${attribute}="${withBasePath(path)}"`,
    )
    .replace(/<pre><code(?:\s[^>]*)?>[\s\S]*?<\/code><\/pre>/g, (original) => {
      const node = blocks[blockIndex++];
      return node ? renderCodeBlock(node, locale) : original;
    });
}
