import type { Metadata } from "next";
import { withBasePath } from "@/lib/paths";
import Header from "./_components/header";
import Footer from "./_components/footer";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://seryio2004.github.io",
    ).origin,
  ),
  title: { default: "Continuous Disintegration — Ideas, código y otras cosas", template: "%s | Continuous Disintegration" },
  description: "Un archivo independiente de programación, electrónica, diseño web e ideas en construcción.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={withBasePath("/favicon/apple-touch-icon.png")}
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
          color="#300a24"
        />
        <link
          rel="shortcut icon"
          href={withBasePath("/favicon/favicon.ico")}
        />
        <meta name="msapplication-TileColor" content="#300a24" />
        <meta
          name="msapplication-config"
          content={withBasePath("/favicon/browserconfig.xml")}
        />
        <meta name="theme-color" content="#300a24" />
        <link
          rel="alternate"
          type="application/rss+xml"
          href={withBasePath("/feed.xml")}
        />
      </head>
      <body id="top"><Header />{children}<Footer /></body>
    </html>
  );
}
