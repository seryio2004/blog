import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import { getAuthorBySlug, getAuthors, getSectionSlug } from "@/lib/api";
import { withBasePath } from "@/lib/paths";
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
        <div className="author-intro__grid"><div className="author-intro__portrait"><img src={withBasePath(author.picture)} alt={`Retrato de ${author.name}`} /><span>COLABORADOR / CD</span></div><div className="author-intro__content"><p className="eyebrow"><span className="eyebrow__square" /> PERFIL DE AUTOR</p><h1>{author.name}<span className="heading-star">*</span></h1><p className="author-intro__bio">{author.bio}</p><div className="author-intro__details"><span>{String(author.posts.length).padStart(2, "0")} ARTÍCULOS PUBLICADOS</span><span>DESDE EL LABORATORIO -&gt;</span></div></div></div>
      </div>
      <section className="archive-section"><div className="section-heading"><div><p className="eyebrow">PUBLICACIONES / {author.name.toUpperCase()}</p><h2>Sus <em>artículos</em><span className="heading-star">*</span></h2></div></div><div className="post-grid">{author.posts.map(post => <PostPreview key={post.slug} {...post} sectionSlug={getSectionSlug(post.section)} />)}</div></section>
    </Container></main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();
  return { title: author.name, description: author.bio };
}

export function generateStaticParams() { return getAuthors().map(author => ({ slug: author.slug })); }
