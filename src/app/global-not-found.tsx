import type { Metadata } from "next";
import Container from "@/app/_components/container";
import { RootDocument } from "@/app/_components/root-document";
import "./globals.css";

export const metadata: Metadata = {
  title: "Página no encontrada / Page not found",
};

export default function GlobalNotFound() {
  return <RootDocument locale="es"><main><Container><div className="page-intro">
    <p className="eyebrow">404</p>
    <h1>Página no encontrada / Page not found</h1>
    <p><a href="/articulos/">Explorar artículos</a> · <a href="/en/articles/" lang="en">Explore articles</a></p>
  </div></Container></main></RootDocument>;
}
