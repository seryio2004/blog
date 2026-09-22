import type { Metadata } from "next";
import { HomePage } from "../_views/home-page";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Continuous Disintegration — Ideas, code and other things",
  description: "An independent archive of programming, electronics, web design and ideas in progress.",
  alternates: { canonical: canonicalUrl("/en/"), languages: { es: canonicalUrl("/"), en: canonicalUrl("/en/"), "x-default": canonicalUrl("/") } },
};

export default function EnglishHome() { return <HomePage locale="en" />; }
