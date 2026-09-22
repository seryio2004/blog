import { ArticlesPageContent } from "../_views/articles-page";
import { canonicalUrl } from "@/lib/site";

export const metadata = { title: "Todos los artículos", description: "Archivo completo de artículos de Continuous Disintegration.", alternates: { canonical: canonicalUrl("/articulos/"), languages: { es: canonicalUrl("/articulos/"), en: canonicalUrl("/en/articles/"), "x-default": canonicalUrl("/articulos/") } } };
export default function ArticlesPage() { return <ArticlesPageContent locale="es" />; }
