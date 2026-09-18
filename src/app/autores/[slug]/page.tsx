import Container from "@/app/_components/container";
import { ArchiveGridFiller } from "@/app/_components/archive-grid-filler";
import { PostPreview } from "@/app/_components/post-preview";
import { getAuthorBySlug, getAuthors, getSectionSlug } from "@/lib/api";
import { withBasePath } from "@/lib/paths";
import { canonicalUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();
  return (
    <main><Container>
      <div className="page-intro author-intro">
        <Link href="/articulos" className="breadcrumb">&lt;- VOLVER AL ARCHIVO</Link>
        <div className="author-intro__grid"><div className="author-intro__portrait"><img src={withBasePath(author.picture)} alt={`Retrato de ${author.name}`} /><span>CREADOR / CD</span></div><div className="author-intro__content"><p className="eyebrow"><span className="eyebrow__square" /> PERFIL DE AUTOR</p><h1>{author.name}<span className="heading-star">*</span></h1><p className="author-intro__bio">{author.bio}</p><div className="author-intro__details"><span>{String(author.posts.length).padStart(2, "0")} ARTÍCULOS PUBLICADOS</span><span>DESDE EL LABORATORIO -&gt;</span></div></div></div>
      </div>
      <div className="filter-strip author-filter-strip"><span>ARCHIVO DEL CREADOR</span><span>{String(author.posts.length).padStart(2, "0")} PUBLICACIONES</span></div>
      <section className="archive-section" aria-labelledby="author-posts-title"><div className="section-heading"><div><p className="eyebrow">PUBLICACIONES / {author.name.toUpperCase()}</p><h2 id="author-posts-title">Sus <em>artículos</em><span className="heading-star">*</span></h2></div></div><div className="post-grid">{author.posts.map(post => <PostPreview key={post.slug} {...post} sectionSlug={getSectionSlug(post.section)} />)}{author.posts.length % 2 === 1 ? <ArchiveGridFiller context="autor" /> : null}</div></section>
    </Container></main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();
  return { title: author.name, description: author.bio, alternates: { canonical: canonicalUrl(`/autores/${author.slug}/`) } };
}

export function generateStaticParams() { return getAuthors().map(author => ({ slug: author.slug })); }
