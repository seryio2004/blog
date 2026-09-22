import { ArticlesPageContent } from "../_views/articles-page";
import { canonicalUrl } from "@/lib/site";
import { buildPageSocialMetadata } from "@/lib/seo";

const title = "Todos los artículos";
const description = "Archivo completo de artículos de Continuous Disintegration.";
const url = canonicalUrl("/articulos/");

export const metadata = {
  title,
  description,
  alternates: { canonical: url, languages: { es: url, en: canonicalUrl("/en/articles/"), "x-default": url } },
  ...buildPageSocialMetadata({ locale: "es", title, description, url }),
};
export default function ArticlesPage() { return <ArticlesPageContent locale="es" />; }
