import { getAllPosts, getSections } from "@/lib/api";
import { copy, routes, type Locale } from "@/lib/i18n";
import {
  canonicalUrl,
  siteAuthor,
  siteAuthorGithub,
  siteAuthorXUrl,
  siteName,
} from "@/lib/site";

export const dynamic = "force-static";

function cleanMarkdown(value: string) {
  return value.replace(/([\\[\]])/g, "\\$1").replace(/\s+/g, " ").trim();
}

function absoluteRoute(path: string) {
  return canonicalUrl(path.endsWith("/") ? path : `${path}/`);
}

function articleList(locale: Locale) {
  const href = routes(locale);

  return getAllPosts(locale)
    .map(
      (post) =>
        `- [${cleanMarkdown(post.title)}](${absoluteRoute(href.post(post.slug))}): ${cleanMarkdown(post.excerpt)}`,
    )
    .join("\n");
}

function sectionList(locale: Locale) {
  const href = routes(locale);

  return getSections(locale)
    .map((section) => {
      const count = section.posts.length;
      const unit = locale === "es"
        ? count === 1 ? "artículo" : "artículos"
        : count === 1 ? "article" : "articles";

      return `- [${cleanMarkdown(section.name)}](${absoluteRoute(href.section(section.slug))}): ${count} ${unit}.`;
    })
    .join("\n");
}

export function GET() {
  const markdown = `# ${siteName}

> Blog tecnológico independiente y bilingüe de ${siteAuthor} sobre programación, electrónica, infraestructura, diseño web y proyectos en construcción. Independent bilingual technology blog by ${siteAuthor} about programming, electronics, infrastructure, web design and projects in progress.

El español es el idioma predeterminado. Cada contenido dispone de una URL independiente en español e inglés; usa la versión que coincida con el idioma de la consulta. Spanish is the default language. Each piece of content has a separate Spanish and English URL; use the version matching the query language.

## Páginas principales / Main pages

- [Inicio en español](${absoluteRoute(routes("es").home)}): ${copy.es.siteDescription}
- [English home](${absoluteRoute(routes("en").home)}): ${copy.en.siteDescription}
- [Archivo de artículos en español](${absoluteRoute(routes("es").articles)}): Todos los artículos publicados en español.
- [English article archive](${absoluteRoute(routes("en").articles)}): Every article published in English.

## Artículos en español

${articleList("es")}

## Articles in English

${articleList("en")}

## Secciones en español

${sectionList("es")}

## Sections in English

${sectionList("en")}

## Descubrimiento / Discovery

- [Sitemap](${canonicalUrl("/sitemap.xml")}): Índice XML de todas las páginas y sus alternativas de idioma.
- [RSS en español](${canonicalUrl("/feed.xml")}): Publicaciones recientes en español.
- [English RSS](${canonicalUrl("/en/feed.xml")}): Recent posts in English.

## Optional

- [Perfil del autor](${absoluteRoute(routes("es").author("sergio-rodriguez"))}): Perfil y artículos de ${siteAuthor}.
- [Author profile](${absoluteRoute(routes("en").author("sergio-rodriguez"))}): ${siteAuthor}'s profile and articles.
- [GitHub](${siteAuthorGithub}): Repositorios públicos de ${siteAuthor}.
- [X](${siteAuthorXUrl}): Perfil de ${siteAuthor} en X.
`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Language": "es, en",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
