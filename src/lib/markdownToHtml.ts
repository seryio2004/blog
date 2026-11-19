import { remark } from "remark";
import html from "remark-html";
import hljs from "highlight.js";
import { visit } from "unist-util-visit";
import type { Code, Image } from "mdast";
import type { Locale } from "./i18n";
import { existsSync } from "fs";
import { join } from "path";
import { readImageSize } from "./image-size";

const mediaLabels = {
  es: { image: "FOTO PENDIENTE", video: "VÍDEO PENDIENTE", model: "MODELO 3D PENDIENTE", model3d: "Modelo 3D", photo: "FOTO", zoom: "Ampliar foto", photos: "~/fotos/", videos: "~/vídeos/", hint: "Arrastra para girar · rueda o pellizco para acercar", download: "Descargar STL", loading: "Cargando modelo…", error: "No se pudo cargar el modelo 3D" },
  en: { image: "PHOTO PENDING", video: "VIDEO PENDING", model: "3D MODEL PENDING", model3d: "3D model", photo: "PHOTO", zoom: "Enlarge photo", photos: "~/photos/", videos: "~/videos/", hint: "Drag to rotate · scroll or pinch to zoom", download: "Download STL", loading: "Loading model…", error: "Could not load the 3D model" },
} as const;

function mediaKind(src: string) {
  if (/\.(mp4|webm)$/i.test(src)) return "video" as const;
  if (/\.stl$/i.test(src)) return "model" as const;
  return "image" as const;
}

function publicFileExists(src: string) {
  if (!isLocal(src)) return true;
  return existsSync(publicPath(src));
}

function publicPath(src: string) {
  return join(process.cwd(), "public", decodeURIComponent(src));
}

function isLocal(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

function localImageSize(src: string) {
  return isLocal(src) ? readImageSize(publicPath(src)) ?? {} : {};
}

// A video can have a poster next to it: demo.mp4 -> demo-poster.{webp,jpg,png}
function videoPoster(src: string) {
  const base = src.replace(/\.[^./]+$/, "");
  return ["webp", "jpg", "png"].map((ext) => `${base}-poster.${ext}`).find((candidate) => existsSync(publicPath(candidate)));
}

// Markdown image syntax doubles as the media syntax of the blog:
//   ![Description](/assets/blog/slug/photo.jpg)  -> image
//   ![Description](/assets/blog/slug/demo.mp4)   -> video player
//   ![Description](/assets/blog/slug/part.stl)   -> interactive 3D viewer
// A missing local file renders a visible placeholder; scripts/check_seo.py
// rejects placeholders on published (non-draft) articles.
function ratioStyle(size: { width: number; height: number } | undefined) {
  return size ? ` style="--media-ratio:${(size.width / size.height).toFixed(4)}"` : "";
}

function mediaFrame(kind: string, path: string, label: string, body: string, caption: string, style = "") {
  return `<figure data-media-frame="${kind}"${style}><div data-media-bar aria-hidden="true"><span><i></i><i></i><i></i></span><span>${path}</span><span>${label}</span></div>${body}${caption ? `<figcaption aria-hidden="true">${caption}</figcaption>` : ""}</figure>`;
}

function renderMedia(original: string, src: string, alt: string, locale: Locale, standalone: boolean) {
  const kind = mediaKind(src);
  const text = mediaLabels[locale];
  if (!publicFileExists(src)) {
    const file = src.split("/").pop() ?? src;
    return `<figure data-media-pending="${kind}"><div><span>${text[kind]}</span><strong>${alt}</strong><code>${escapeHtml(file)}</code></div></figure>`;
  }
  if (kind === "video") {
    const format = src.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
    const poster = isLocal(src) ? videoPoster(src) : undefined;
    const size = poster ? readImageSize(publicPath(poster)) : undefined;
    const posterAttrs = poster ? ` poster="${poster}"${size ? ` width="${size.width}" height="${size.height}"` : ""}` : "";
    const video = `<video controls playsinline preload="metadata"${posterAttrs} aria-label="${alt}"><source src="${src}" type="video/${format}"><a href="${src}">${alt}</a></video>`;
    const file = escapeHtml(src.split("/").pop() ?? src);
    return standalone ? mediaFrame("video", `${text.videos}${file}`, format.toUpperCase(), video, alt, ratioStyle(size)) : video;
  }
  if (kind === "model") {
    const file = escapeHtml(src.split("/").pop() ?? src);
    return `<figure data-stl-viewer data-src="${src}" data-error="${text.error}"><div data-stl-bar aria-hidden="true"><span><i></i><i></i><i></i></span><span>~/modelos/${file}</span><span>STL / 3D</span></div><div data-stl-canvas role="img" aria-label="${text.model3d}: ${alt}"><span data-stl-status>${text.loading}</span></div><figcaption><span>${alt}</span><small>${text.hint} · <a href="${src}" download>${text.download}</a></small></figcaption></figure>`;
  }
  if (standalone && isLocal(src)) {
    const file = escapeHtml(src.split("/").pop() ?? src);
    const extension = file.split(".").pop()?.toUpperCase() ?? "";
    const trigger = `<button type="button" data-zoom-src="${src}" data-zoom-alt="${alt}" aria-label="${text.zoom}: ${alt}">${original}</button>`;
    return mediaFrame("image", `${text.photos}${file}`, `${text.photo} / ${extension}`, trigger, alt, ratioStyle(readImageSize(publicPath(src))));
  }
  return original;
}

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
    .use(() => (tree) => {
      visit(tree, "image", (node: Image) => {
        node.data = {
          ...node.data,
          hProperties: {
            ...(mediaKind(node.url) === "image" ? localImageSize(node.url) : {}),
          },
        };
      });
    })
    .use(html)
    .process(markdown);
  let blockIndex = 0;
  return result
    .toString()
    .replace(/(<p>)?(<img src="([^"]+)" alt="([^"]*)"[^>]*>)(<\/p>)?/g,
      (match, open: string | undefined, img: string, src: string, alt: string, close: string | undefined) => {
        const media = renderMedia(img, src, alt, locale, Boolean(open && close));
        if (media === img) return match;
        // A standalone image owns its paragraph; inline ones keep the surrounding tags.
        return open && close ? media : `${open ?? ""}${media}${close ?? ""}`;
      })
    .replace(/<img\b/g, '<img loading="lazy" decoding="async"')
    .replace(/<pre><code(?:\s[^>]*)?>[\s\S]*?<\/code><\/pre>/g, (original) => {
      const node = blocks[blockIndex++];
      return node ? renderCodeBlock(node, locale) : original;
    });
}
