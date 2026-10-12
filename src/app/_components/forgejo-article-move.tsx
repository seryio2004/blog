import type { Metadata } from "next";
import { routes, type Locale } from "@/lib/i18n";
import { withBasePath } from "@/lib/paths";
import { canonicalUrl } from "@/lib/site";

const articleSlug = "guia-workflows";

export function forgejoArticleMoveMetadata(locale: Locale): Metadata {
  return {
    title: locale === "es" ? "Artículo unificado de Forgejo" : "Consolidated Forgejo article",
    alternates: { canonical: canonicalUrl(`${routes(locale).post(articleSlug)}/`) },
    robots: { index: false, follow: true },
  };
}

// Static exports cannot send HTTP redirects; retain legacy URLs with a refresh
// and a visible link for readers whose browser does not follow it.
export function ForgejoArticleMove({ locale }: { locale: Locale }) {
  const href = withBasePath(`${routes(locale).post(articleSlug)}/`);
  return (
    <main className="container" lang={locale}>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <h1>{locale === "es" ? "Este artículo forma parte de la guía de Forgejo" : "This article is now part of the Forgejo guide"}</h1>
      <p><a href={href}>{locale === "es" ? "Leer la guía completa: runners, CI/CD y paquetes" : "Read the complete guide: runners, CI/CD and packages"}</a></p>
    </main>
  );
}
