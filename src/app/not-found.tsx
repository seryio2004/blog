import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/app/_components/container";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <main><Container><div className="page-intro">
    <p className="eyebrow">404</p>
    <h1>Página no encontrada / Page not found</h1>
    <p><Link href="/articulos/">Explorar artículos</Link> · <Link href="/en/articles/">Explore articles</Link></p>
  </div></Container></main>;
}
