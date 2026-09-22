import Container from "@/app/_components/container";
import { ArchiveGridFiller } from "@/app/_components/archive-grid-filler";
import { PageChrome } from "@/app/_components/page-chrome";
import { PostPreview } from "@/app/_components/post-preview";
import { getAlternateSectionSlug, getSectionBySlug, getSections } from "@/lib/api";
import { routes, type Locale } from "@/lib/i18n";
import { canonicalUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ section: string }> };

export async function SectionPageContent({ params, locale }: Props & { locale: Locale }) {
  const { section: slug } = await params;
  const section = getSectionBySlug(slug, locale);
  if (!section) notFound();
  const sections = getSections(locale);
  const index = sections.findIndex(item => item.slug === section.slug) + 1;
  const href = routes(locale);
  const alternateSlug = getAlternateSectionSlug(slug, locale);
  const alternateHref = routes(locale === "es" ? "en" : "es").section(alternateSlug);
  const text = locale === "es" ? { back: "<- VOLVER AL ARCHIVO", eyebrow: "SECCIÓN", thematic: "ARCHIVO TEMÁTICO", route: "RUTA", introA: "Artículos, guías y notas reunidos alrededor de", publications: "PUBLICACIONES", other: "OTRAS SECCIONES", label: "Otras secciones", all: "TODO", list: "/ ARTÍCULOS EN ESTA SECCIÓN", order: "ORDENADOS POR FECHA v" } : { back: "<- BACK TO ARCHIVE", eyebrow: "SECTION", thematic: "TOPIC ARCHIVE", route: "ROUTE", introA: "Articles, guides and notes gathered around", publications: "PUBLICATIONS", other: "OTHER SECTIONS", label: "Other sections", all: "ALL", list: "/ ARTICLES IN THIS SECTION", order: "SORTED BY DATE v" };

  return <PageChrome locale={locale} alternateHref={alternateHref}><main><Container>
    <div className="page-intro page-intro--section"><Link href={href.articles} className="breadcrumb">{text.back}</Link><div className="page-intro__grid"><div><p className="eyebrow">{text.eyebrow} / {String(index).padStart(2, "0")} — {text.thematic}</p><h1>{section.name}<span className="heading-star">*</span></h1></div><div className="page-intro__side"><span>{text.route} / {section.slug.toUpperCase()}</span><p>{text.introA} {section.name}.</p><span className="page-intro__count">{String(section.posts.length).padStart(2, "0")} {text.publications} -&gt;</span></div></div></div>
    <div className="filter-strip"><span>{text.other}</span><nav aria-label={text.label}><Link href={href.articles} className="filter-chip">{text.all}</Link>{sections.map(item => <Link key={item.slug} href={href.section(item.slug)} className={`filter-chip ${item.slug === section.slug ? "filter-chip--active" : ""}`}>{item.name.toUpperCase()} <sup>{item.posts.length}</sup></Link>)}</nav></div>
    <section className="archive-section"><div className="archive-section__heading"><p className="eyebrow">{text.list}</p><span>{text.order}</span></div><div className="post-grid">{section.posts.map(post => <PostPreview key={post.slug} {...post} sectionSlug={section.slug} locale={locale} />)}{section.posts.length % 2 === 1 ? <ArchiveGridFiller context={section.slug} locale={locale} /> : null}</div></section>
  </Container></main></PageChrome>;
}

export async function buildSectionMetadata({ params, locale }: Props & { locale: Locale }): Promise<Metadata> {
  const { section: slug } = await params;
  const section = getSectionBySlug(slug, locale);
  if (!section) notFound();
  const otherSlug = getAlternateSectionSlug(slug, locale);
  const esPath = locale === "es" ? routes("es").section(section.slug) : routes("es").section(otherSlug);
  const enPath = locale === "en" ? routes("en").section(section.slug) : routes("en").section(otherSlug);
  const es = canonicalUrl(esPath + "/"); const en = canonicalUrl(enPath + "/");
  return { title: section.name, description: locale === "es" ? `Artículos de ${section.name} en Continuous Disintegration.` : `${section.name} articles on Continuous Disintegration.`, alternates: { canonical: locale === "es" ? es : en, languages: { es, en, "x-default": es } } };
}
