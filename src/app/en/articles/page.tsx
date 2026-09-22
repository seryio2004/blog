import type { Metadata } from "next";
import { ArticlesPageContent } from "../../_views/articles-page";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = { title: "All articles", description: "The complete Continuous Disintegration article archive.", alternates: { canonical: canonicalUrl("/en/articles/"), languages: { es: canonicalUrl("/articulos/"), en: canonicalUrl("/en/articles/"), "x-default": canonicalUrl("/articulos/") } } };
export default function EnglishArticlesPage() { return <ArticlesPageContent locale="en" />; }
