import { remark } from "remark";
import html from "remark-html";
import { withBasePath } from "./paths";

export default async function markdownToHtml(markdown: string) {
  const result = await remark().use(html).process(markdown);
  return result
    .toString()
    .replace(
      /\b(src|href)="(\/(?!\/)[^"]*)"/g,
      (_match, attribute: string, path: string) =>
        `${attribute}="${withBasePath(path)}"`,
    );
}
