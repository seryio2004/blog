import type { Post } from "@/interfaces/post";
import type { Locale } from "@/lib/i18n";
import { withBasePath } from "@/lib/paths";
import { canonicalSiteUrl, defaultSocialImage } from "@/lib/site";

export const postSocialImageSize = { width: 1200, height: 630 };

export function postSocialImagePath(slug: string, locale: Locale) {
  return `/social/${locale}/${encodeURIComponent(slug)}.png`;
}

export function getPostSocialImage(post: Post, locale: Locale) {
  const customImage = post.ogImage?.url;
  const generated = !customImage || customImage === defaultSocialImage;
  const path = generated ? postSocialImagePath(post.slug, locale) : customImage;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || canonicalSiteUrl;

  return {
    url: new URL(withBasePath(path), siteUrl).toString(),
    ...(generated ? { ...postSocialImageSize, type: "image/png" } : {}),
    alt: post.title,
  };
}
