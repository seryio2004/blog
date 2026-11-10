import type { MetadataRoute } from "next";
import type { Post } from "@/interfaces/post";
import { getAllPosts, getAlternateSectionSlug, getAuthors, getSections } from "@/lib/api";
import { canonicalUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const esPosts = getAllPosts("es");
  const enPosts = getAllPosts("en");
  const latestModified = (posts: Post[]) => posts.length
    ? new Date(Math.max(...posts.map(post => Date.parse(post.updatedDate ?? post.date)))).toISOString()
    : undefined;
  const languageAlternates = (esPath: string, enPath: string) => ({
    es: canonicalUrl(esPath),
    en: canonicalUrl(enPath),
    "x-default": canonicalUrl(esPath),
  });

  return [
    { url: canonicalUrl("/"), lastModified: latestModified(esPosts), alternates: { languages: languageAlternates("/", "/en/") } },
    { url: canonicalUrl("/en/"), lastModified: latestModified(enPosts), alternates: { languages: languageAlternates("/", "/en/") } },
    { url: canonicalUrl("/articulos/"), lastModified: latestModified(esPosts), alternates: { languages: languageAlternates("/articulos/", "/en/articles/") } },
    { url: canonicalUrl("/en/articles/"), lastModified: latestModified(enPosts), alternates: { languages: languageAlternates("/articulos/", "/en/articles/") } },
    { url: canonicalUrl("/rss/"), lastModified: latestModified(esPosts), alternates: { languages: languageAlternates("/rss/", "/en/rss/") } },
    { url: canonicalUrl("/en/rss/"), lastModified: latestModified(enPosts), alternates: { languages: languageAlternates("/rss/", "/en/rss/") } },
    ...getSections("es").map((section) => {
      const enSlug = getAlternateSectionSlug(section.slug, "es");
      return {
        url: canonicalUrl(`/secciones/${section.slug}/`),
        lastModified: latestModified(section.posts),
        alternates: { languages: languageAlternates(`/secciones/${section.slug}/`, `/en/sections/${enSlug}/`) },
      };
    }),
    ...getSections("en").map((section) => {
      const esSlug = getAlternateSectionSlug(section.slug, "en");
      return {
        url: canonicalUrl(`/en/sections/${section.slug}/`),
        lastModified: latestModified(section.posts),
        alternates: { languages: languageAlternates(`/secciones/${esSlug}/`, `/en/sections/${section.slug}/`) },
      };
    }),
    ...getAuthors("es").map((author) => ({
      url: canonicalUrl(`/autores/${author.slug}/`),
      lastModified: latestModified(author.posts),
      alternates: { languages: languageAlternates(`/autores/${author.slug}/`, `/en/authors/${author.slug}/`) },
    })),
    ...getAuthors("en").map((author) => ({
      url: canonicalUrl(`/en/authors/${author.slug}/`),
      lastModified: latestModified(author.posts),
      alternates: { languages: languageAlternates(`/autores/${author.slug}/`, `/en/authors/${author.slug}/`) },
    })),
    ...esPosts.map((post) => ({
      url: canonicalUrl(`/posts/${encodeURIComponent(post.slug)}/`),
      lastModified: post.updatedDate ?? post.date,
      alternates: { languages: languageAlternates(`/posts/${encodeURIComponent(post.slug)}/`, `/en/posts/${encodeURIComponent(post.slug)}/`) },
    })),
    ...enPosts.map((post) => ({
      url: canonicalUrl(`/en/posts/${encodeURIComponent(post.slug)}/`),
      lastModified: post.updatedDate ?? post.date,
      alternates: { languages: languageAlternates(`/posts/${encodeURIComponent(post.slug)}/`, `/en/posts/${encodeURIComponent(post.slug)}/`) },
    })),
  ];
}
