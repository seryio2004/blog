import type { Metadata } from "next";
import { ArticlesPageContent } from "../../_views/articles-page";
import { canonicalUrl } from "@/lib/site";
import { buildPageSocialMetadata } from "@/lib/seo";

const title = "All articles";
const description = "The complete Continuous Disintegration article archive.";
const url = canonicalUrl("/en/articles/");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url, languages: { es: canonicalUrl("/articulos/"), en: url, "x-default": canonicalUrl("/articulos/") } },
  ...buildPageSocialMetadata({ locale: "en", title, description, url }),
};
export default function EnglishArticlesPage() { return <ArticlesPageContent locale="en" />; }
