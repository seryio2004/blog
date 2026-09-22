import Container from "@/app/_components/container";
import { ArticlesList } from "@/app/_components/articles-list";
import { PageChrome } from "@/app/_components/page-chrome";
import { getAllPosts, getSectionSlug, getSections } from "@/lib/api";
import { routes, type Locale } from "@/lib/i18n";
import Link from "next/link";

const pageCopy = {
  es: { alternate: "/en/articles", back: "<- VOLVER AL INICIO", eyebrow: "ARCHIVO / TODOS LOS REGISTROS", titleA: "Todos los", titleB: "artículos.", intro: "Un registro de ideas en proceso. Busca una ruta, elige una lectura y sigue el hilo.", available: "ENTRADAS DISPONIBLES", explore: "EXPLORAR POR TEMA", all: "TODO", label: "Filtrar por sección" },
  en: { alternate: "/articulos", back: "<- BACK TO HOME", eyebrow: "ARCHIVE / ALL RECORDS", titleA: "All", titleB: "articles.", intro: "A record of ideas in progress. Find a route, choose a read and follow the thread.", available: "ENTRIES AVAILABLE", explore: "EXPLORE BY TOPIC", all: "ALL", label: "Filter by section" },
} as const;

export function ArticlesPageContent({ locale }: { locale: Locale }) {
  const text = pageCopy[locale];
  const href = routes(locale);
  const posts = getAllPosts(locale).map(post => ({ ...post, sectionSlug: getSectionSlug(post.section) }));
  const sections = getSections(locale);
  return <PageChrome locale={locale} alternateHref={text.alternate}><main><Container>
    <div className="page-intro"><Link href={href.home} className="breadcrumb">{text.back}</Link><div className="page-intro__grid"><div><p className="eyebrow">{text.eyebrow}</p><h1>{text.titleA}<br /><em>{text.titleB}</em></h1></div><div className="page-intro__side"><span>INDEX_002</span><p>{text.intro}</p><span className="page-intro__count">{String(posts.length).padStart(2, "0")} {text.available} -&gt;</span></div></div></div>
    <div className="filter-strip"><span>{text.explore}</span><nav aria-label={text.label}><Link href={href.articles} className="filter-chip filter-chip--active">{text.all} <sup>{posts.length}</sup></Link>{sections.map(section => <Link key={section.slug} href={href.section(section.slug)} className="filter-chip">{section.name.toUpperCase()} <sup>{section.posts.length}</sup></Link>)}</nav></div>
    <section className="archive-section"><ArticlesList posts={posts} locale={locale} /></section>
  </Container></main></PageChrome>;
}
