import type { PostLanguage } from "@/interfaces/post";

export type Locale = PostLanguage;

export const defaultLocale: Locale = "es";
export const locales: Locale[] = ["es", "en"];

export const copy = {
  es: {
    siteDescription: "Un archivo independiente de programación, electrónica, diseño web e ideas en construcción.",
    nav: { home: "Inicio", articles: "Artículos", sections: "Secciones", label: "Navegación principal" },
    systemActive: "SISTEMA ACTIVO",
    exploreArticles: "Explorar artículos",
    footerEnd: "// FIN DEL ARCHIVO",
    footerStatement: ["Seguimos", "cacharreando"] as const,
    footerTagline: "IDEAS, CÓDIGO Y OTRAS COSAS.",
    backTop: "VOLVER ARRIBA ^",
    readArticle: "LEER ARTÍCULO",
    readLabel: "Leer",
    authorProfile: "Ver perfil de",
    editorial: "EDITORIAL",
    languageName: "español",
    sort: "ORDENAR /",
    sortLabel: "Orden de los artículos",
    newest: "Más recientes",
    oldest: "Más antiguos",
    publicationIndex: "/ ÍNDICE DE PUBLICACIONES",
    filler: { log: "publicaciones.log", synced: "[ok] índice sincronizado", signals: "[ok] señales recibidas", waiting: ["ESPERANDO LA", "SIGUIENTE ENTRADA"] as const },
  },
  en: {
    siteDescription: "An independent archive of programming, electronics, web design and ideas in progress.",
    nav: { home: "Home", articles: "Articles", sections: "Sections", label: "Main navigation" },
    systemActive: "SYSTEM ONLINE",
    exploreArticles: "Explore articles",
    footerEnd: "// END OF ARCHIVE",
    footerStatement: ["We keep", "tinkering"] as const,
    footerTagline: "IDEAS, CODE AND OTHER THINGS.",
    backTop: "BACK TO TOP ^",
    readArticle: "READ ARTICLE",
    readLabel: "Read",
    authorProfile: "View profile for",
    editorial: "EDITORIAL",
    languageName: "English",
    sort: "SORT /",
    sortLabel: "Article order",
    newest: "Newest first",
    oldest: "Oldest first",
    publicationIndex: "/ PUBLICATION INDEX",
    filler: { log: "publications.log", synced: "[ok] index synchronized", signals: "[ok] signals received", waiting: ["WAITING FOR THE", "NEXT ENTRY"] as const },
  },
} as const;

export function routes(locale: Locale) {
  const prefix = locale === "en" ? "/en" : "";
  return {
    home: prefix || "/",
    articles: locale === "en" ? "/en/articles" : "/articulos",
    sectionsAnchor: `${prefix || "/"}#${locale === "es" ? "secciones" : "sections"}`,
    post: (slug: string) => `${prefix}/posts/${slug}`,
    section: (slug: string) => locale === "en" ? `/en/sections/${slug}` : `/secciones/${slug}`,
    author: (slug: string) => locale === "en" ? `/en/authors/${slug}` : `/autores/${slug}`,
  };
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}
