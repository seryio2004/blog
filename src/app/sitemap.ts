import type { MetadataRoute } from "next";
import { getAllPosts, getAuthors, getSections } from "@/lib/api";
import { canonicalUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: canonicalUrl("/") },
    { url: canonicalUrl("/articulos/") },
    ...getSections().map((section) => ({
      url: canonicalUrl(`/secciones/${section.slug}/`),
    })),
    ...getAuthors().map((author) => ({
      url: canonicalUrl(`/autores/${author.slug}/`),
    })),
    ...getAllPosts().map((post) => ({
      url: canonicalUrl(`/posts/${encodeURIComponent(post.slug)}/`),
    })),
  ];
}
