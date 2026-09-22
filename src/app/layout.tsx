import type { Metadata } from "next";
import { withBasePath } from "@/lib/paths";
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

import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  canonicalSiteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(new URL(siteUrl).origin),
  applicationName: siteName,
  authors: [{ name: siteAuthor, url: canonicalUrl("/autores/sergio-rodriguez/") }],
  creator: siteAuthor,
  publisher: siteAuthor,
  category: "technology",
  alternates: { canonical: canonicalUrl("/"), languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/"), "x-default": canonicalUrl("/") } },
  title: {
    default: "Continuous Disintegration — Ideas, código y otras cosas",
    template: "%s | Continuous Disintegration",
  },
  description:
    "Un archivo independiente de programación, electrónica, diseño web e ideas en construcción.",
  openGraph: {
    type: "website",
    siteName,
    title: "Continuous Disintegration — Ideas, código y otras cosas",
    description: "Un archivo independiente de programación, electrónica, diseño web e ideas en construcción.",
    url: canonicalUrl("/"),
    locale: "es_ES",
    alternateLocale: "en_GB",
    images: [{ url: canonicalUrl(defaultSocialImage), width: defaultSocialImageWidth, height: defaultSocialImageHeight, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    creator: siteAuthorX,
    title: "Continuous Disintegration — Ideas, código y otras cosas",
    description: "Un archivo independiente de programación, electrónica, diseño web e ideas en construcción.",
    images: [canonicalUrl(defaultSocialImage)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={withBasePath("/favicon/apple-touch-icon.png")}
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href={withBasePath("/favicon/favicon.svg")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={withBasePath("/favicon/favicon-32x32.png")}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={withBasePath("/favicon/favicon-16x16.png")}
        />
        <link
          rel="manifest"
          href={withBasePath("/favicon/site.webmanifest")}
        />
        <link
          rel="mask-icon"
          href={withBasePath("/favicon/safari-pinned-tab.svg")}
          color="#000000"
        />
        <link
          rel="shortcut icon"
          href={withBasePath("/favicon/favicon.ico")}
        />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-config"
          content={withBasePath("/favicon/browserconfig.xml")}
        />
        <meta name="theme-color" content="#000000" />
        <link
          rel="alternate"
          type="application/rss+xml"
          hrefLang="es"
          href={withBasePath("/feed.xml")}
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          hrefLang="en"
          href={withBasePath("/en/feed.xml")}
        />
        <link rel="describedby" href={withBasePath("/llms.txt")} />
      </head>
      <body id="top">
        <script dangerouslySetInnerHTML={{ __html: "if(location.pathname==='/en'||location.pathname.startsWith('/en/'))document.documentElement.lang='en'" }} />
        {children}
      </body>
    </html>
  );
}
