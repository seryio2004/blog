import Container from "@/app/_components/container";
import { ArchiveGridFiller } from "@/app/_components/archive-grid-filler";
import { PageChrome } from "@/app/_components/page-chrome";
import { PostPreview } from "@/app/_components/post-preview";
import { getAuthorBySlug, getAuthors, getSectionSlug } from "@/lib/api";
import { routes, type Locale } from "@/lib/i18n";
import { withBasePath } from "@/lib/paths";
import { canonicalUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function AuthorPageContent({ params, locale }: Props & { locale: Locale }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug, locale);
  if (!author) notFound();
  const href = routes(locale);
  const alternateHref = routes(locale === "es" ? "en" : "es").author(author.slug);
  const text = locale === "es" ? { back: "<- VOLVER AL ARCHIVO", portrait: "Retrato de", creator: "CREADOR / CD", profile: "PERFIL DE AUTOR", published: "ARTÍCULOS PUBLICADOS", lab: "DESDE EL LABORATORIO", archive: "ARCHIVO DEL CREADOR", publications: "PUBLICACIONES", posts: "PUBLICACIONES", theirs: "Sus", articles: "artículos", filler: "autor" } : { back: "<- BACK TO ARCHIVE", portrait: "Portrait of", creator: "CREATOR / CD", profile: "AUTHOR PROFILE", published: "ARTICLES PUBLISHED", lab: "FROM THE LAB", archive: "CREATOR ARCHIVE", publications: "PUBLICATIONS", posts: "PUBLICATIONS", theirs: "Their", articles: "articles", filler: "author" };
  return <PageChrome locale={locale} alternateHref={alternateHref}><main><Container>
    <div className="page-intro author-intro"><Link href={href.articles} className="breadcrumb">{text.back}</Link><div className="author-intro__grid"><div className="author-intro__portrait"><img src={withBasePath(author.picture)} alt={`${text.portrait} ${author.name}`} /><span>{text.creator}</span></div><div className="author-intro__content"><p className="eyebrow"><span className="eyebrow__square" /> {text.profile}</p><h1>{author.name}<span className="heading-star">*</span></h1><p className="author-intro__bio">{author.bio}</p><div className="author-intro__details"><span>{String(author.posts.length).padStart(2, "0")} {text.published}</span><span>{text.lab} -&gt;</span></div></div></div></div>
    <div className="filter-strip author-filter-strip"><span>{text.archive}</span><span>{String(author.posts.length).padStart(2, "0")} {text.publications}</span></div>
    <section className="archive-section" aria-labelledby="author-posts-title"><div className="section-heading"><div><p className="eyebrow">{text.posts} / {author.name.toUpperCase()}</p><h2 id="author-posts-title">{text.theirs} <em>{text.articles}</em><span className="heading-star">*</span></h2></div></div><div className="post-grid">{author.posts.map(post => <PostPreview key={post.slug} {...post} sectionSlug={getSectionSlug(post.section)} locale={locale} />)}{author.posts.length % 2 === 1 ? <ArchiveGridFiller context={text.filler} locale={locale} /> : null}</div></section>
  </Container></main></PageChrome>;
}

export async function buildAuthorMetadata({ params, locale }: Props & { locale: Locale }): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug, locale);
  if (!author) notFound();
  const es = canonicalUrl(routes("es").author(author.slug) + "/"); const en = canonicalUrl(routes("en").author(author.slug) + "/");
  return { title: author.name, description: author.bio, alternates: { canonical: locale === "es" ? es : en, languages: { es, en, "x-default": es } } };
}
