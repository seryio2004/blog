import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/app/_components/container";
import { ArticlesList } from "@/app/_components/articles-list";
import { PageChrome } from "@/app/_components/page-chrome";
import { getAllPosts, getSectionSlug } from "@/lib/api";
import { routes } from "@/lib/i18n";

// Landing page for the TikTok bio link. It is not indexed: it repeats the
// archive and only exists so viewers land on a short, memorable URL.
export const metadata: Metadata = {
  title: "Vienes de TikTok",
  description: "Las guías completas de los proyectos que enseño en TikTok.",
  robots: { index: false, follow: true },
};

export default function TikTokPage() {
  const href = routes("es");
  const posts = getAllPosts("es").map((post) => ({ ...post, sectionSlug: getSectionSlug(post.section) }));
  return <PageChrome locale="es" alternateHref="/en/"><main><Container>
    <div className="page-intro"><Link href={href.home} className="breadcrumb">{"<- IR AL INICIO"}</Link><div className="page-intro__grid"><div><p className="eyebrow">TIKTOK / GUÍAS COMPLETAS</p><h1>¿Vienes del<br /><em>vídeo?</em></h1></div><div className="page-intro__side"><span>LINK_EN_BIO</span><p>En el vídeo va la versión corta. Aquí tienes el paso a paso: comandos, configuración y los errores que me encontré.</p><Link className="page-intro__count" href={href.rss}>SIGUE LOS NUEVOS ARTÍCULOS POR RSS -&gt;</Link></div></div></div>
    <section className="archive-section"><ArticlesList posts={posts} locale="es" /></section>
  </Container></main></PageChrome>;
}
