import type { Metadata } from "next";
import { withBasePath } from "@/lib/paths";
import { canonicalSiteUrl, canonicalUrl } from "@/lib/site";

import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  canonicalSiteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(new URL(siteUrl).origin),
  alternates: { canonical: canonicalUrl("/"), languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/"), "x-default": canonicalUrl("/") } },
  title: {
    default: "Continuous Disintegration — Ideas, código y otras cosas",
    template: "%s | Continuous Disintegration",
  },
  description:
    "Un archivo independiente de programación, electrónica, diseño web e ideas en construcción.",
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
      </head>
      <body id="top">
        <script dangerouslySetInnerHTML={{ __html: "if(location.pathname==='/en'||location.pathname.startsWith('/en/'))document.documentElement.lang='en'" }} />
        {children}
      </body>
    </html>
  );
}
