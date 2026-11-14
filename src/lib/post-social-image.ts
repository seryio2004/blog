import type { Post } from "@/interfaces/post";
import type { Locale } from "@/lib/i18n";
import { canonicalUrl, defaultSocialImage } from "@/lib/site";

export const postSocialImageSize = { width: 1200, height: 630 };

export function postSocialImagePath(slug: string, locale: Locale) {
  return `/social/${locale}/${encodeURIComponent(slug)}.png`;
}

export function getPostSocialImage(post: Post, locale: Locale) {
  const customImage = post.ogImage?.url;
  const generated = !customImage || customImage === defaultSocialImage || customImage === "/assets/blog/social-preview.png";
  const path = generated ? postSocialImagePath(post.slug, locale) : customImage;

  return {
    url: canonicalUrl(path),
    ...(generated ? { ...postSocialImageSize, type: "image/png" } : {}),
    alt: post.title,
  };
}
