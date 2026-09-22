import type { Metadata } from "next";
import { HomePage } from "../_views/home-page";
import { canonicalUrl } from "@/lib/site";
import { defaultSocialImage, defaultSocialImageHeight, defaultSocialImageWidth, siteAuthorX, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Continuous Disintegration — Ideas, code and other things" },
  description: "An independent archive of programming, electronics, web design and ideas in progress.",
  alternates: { canonical: canonicalUrl("/en/"), languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/"), "x-default": canonicalUrl("/") } },
  openGraph: {
    type: "website",
    siteName,
    title: "Continuous Disintegration — Ideas, code and other things",
    description: "An independent archive of programming, electronics, web design and ideas in progress.",
    url: canonicalUrl("/en/"),
    locale: "en_GB",
    alternateLocale: "es_ES",
    images: [{ url: canonicalUrl(defaultSocialImage), width: defaultSocialImageWidth, height: defaultSocialImageHeight, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    creator: siteAuthorX,
    title: "Continuous Disintegration — Ideas, code and other things",
    description: "An independent archive of programming, electronics, web design and ideas in progress.",
    images: [canonicalUrl(defaultSocialImage)],
  },
};

export default function EnglishHome() { return <HomePage locale="en" />; }
