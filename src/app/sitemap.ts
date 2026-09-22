import type { MetadataRoute } from "next";
import { getAllPosts, getAuthors, getSections } from "@/lib/api";
import { canonicalUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const esPosts = getAllPosts("es");
  const enPosts = getAllPosts("en");
  return [
    { url: canonicalUrl("/"), alternates: { languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/") } } },
    { url: canonicalUrl("/en/"), alternates: { languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/") } } },
    { url: canonicalUrl("/articulos/"), alternates: { languages: { es: canonicalUrl("/articulos/"), en: canonicalUrl("/en/articles/") } } },
    { url: canonicalUrl("/en/articles/"), alternates: { languages: { es: canonicalUrl("/articulos/"), en: canonicalUrl("/en/articles/") } } },
    ...getSections("es").map((section) => ({
      url: canonicalUrl(`/secciones/${section.slug}/`),
    })),
    ...getSections("en").map((section) => ({
      url: canonicalUrl(`/en/sections/${section.slug}/`),
    })),
    ...getAuthors("es").map((author) => ({
      url: canonicalUrl(`/autores/${author.slug}/`),
    })),
    ...getAuthors("en").map((author) => ({
      url: canonicalUrl(`/en/authors/${author.slug}/`),
    })),
    ...esPosts.map((post) => ({
      url: canonicalUrl(`/posts/${encodeURIComponent(post.slug)}/`),
      alternates: { languages: { es: canonicalUrl(`/posts/${encodeURIComponent(post.slug)}/`), en: canonicalUrl(`/en/posts/${encodeURIComponent(post.slug)}/`) } },
    })),
    ...enPosts.map((post) => ({
      url: canonicalUrl(`/en/posts/${encodeURIComponent(post.slug)}/`),
      alternates: { languages: { es: canonicalUrl(`/posts/${encodeURIComponent(post.slug)}/`), en: canonicalUrl(`/en/posts/${encodeURIComponent(post.slug)}/`) } },
    })),
  ];
}
