import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import {
  canonicalUrl,
  defaultSocialImage,
  defaultSocialImageHeight,
  defaultSocialImageWidth,
  siteAuthorX,
  siteName,
} from "@/lib/site";

type PageSocialMetadataOptions = {
  locale: Locale;
  title: string;
  description: string;
  url: string;
  image?: string;
};

export function buildPageSocialMetadata({
  locale,
  title,
  description,
  url,
  image = defaultSocialImage,
}: PageSocialMetadataOptions): Pick<Metadata, "openGraph" | "twitter"> {
  const imageUrl = canonicalUrl(image);

  return {
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url,
      locale: locale === "es" ? "es_ES" : "en_GB",
      alternateLocale: locale === "es" ? "en_GB" : "es_ES",
      images: [{
        url: imageUrl,
        ...(image === defaultSocialImage ? { width: defaultSocialImageWidth, height: defaultSocialImageHeight } : {}),
        alt: title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      creator: siteAuthorX,
      title,
      description,
      images: [imageUrl],
    },
  };
}
