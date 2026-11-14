import type { Metadata } from "next";
import { copy, type Locale } from "@/lib/i18n";
import {
  canonicalSiteUrl,
  canonicalUrl,
  defaultSocialImage,
  defaultSocialImageHeight,
  defaultSocialImageWidth,
  siteAuthor,
  siteAuthorX,
  siteName,
} from "@/lib/site";

// Cloudflare Web Analytics token (public; it is visible in every page).
// Left empty, no analytics script is rendered.
const analyticsToken = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim();

const homeTitle: Record<Locale, string> = {
  es: "Continuous Disintegration — Ideas, código y otras cosas",
  en: "Continuous Disintegration — Ideas, code and other things",
};

export function rootMetadata(locale: Locale): Metadata {
  const home = canonicalUrl(locale === "es" ? "/" : "/en/");
  const title = homeTitle[locale];
  const description = copy[locale].siteDescription;

  return {
    metadataBase: new URL(canonicalSiteUrl),
    applicationName: siteName,
    authors: [{ name: siteAuthor, url: canonicalUrl(locale === "es" ? "/autores/sergio-rodriguez/" : "/en/authors/sergio-rodriguez/") }],
    creator: siteAuthor,
    publisher: siteAuthor,
    category: "technology",
    alternates: { canonical: home, languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/"), "x-default": canonicalUrl("/") } },
    title: { default: title, template: "%s | Continuous Disintegration" },
    description,
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: home,
      locale: locale === "es" ? "es_ES" : "en_GB",
      alternateLocale: locale === "es" ? "en_GB" : "es_ES",
      images: [{ url: canonicalUrl(defaultSocialImage), width: defaultSocialImageWidth, height: defaultSocialImageHeight, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      creator: siteAuthorX,
      title,
      description,
      images: [canonicalUrl(defaultSocialImage)],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
        <meta name="theme-color" content="#000000" />
        <link rel="alternate" type="application/rss+xml" hrefLang="es" href="/feed.xml" />
        <link rel="alternate" type="application/rss+xml" hrefLang="en" href="/en/feed.xml" />
        <link rel="describedby" href="/llms.txt" />
      </head>
      <body id="top">
        {children}
        {analyticsToken ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: analyticsToken })}
          />
        ) : null}
      </body>
    </html>
  );
}
