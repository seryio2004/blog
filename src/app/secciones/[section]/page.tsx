import Container from "@/app/_components/container";
import { ArchiveGridFiller } from "@/app/_components/archive-grid-filler";
import { PostPreview } from "@/app/_components/post-preview";
import { getSectionBySlug, getSections } from "@/lib/api";
import { canonicalUrl } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ section: string }> };

export default async function SectionPage({ params }: Props) {
  const { section: slug } = await params;
  const section = getSectionBySlug(slug);
  if (!section) notFound();
  const sections = getSections();
  const index = sections.findIndex(item => item.slug === section.slug) + 1;

  return (
    <main><Container>
      <div className="page-intro page-intro--section">
        <Link href="/articulos" className="breadcrumb">&lt;- VOLVER AL ARCHIVO</Link>
        <div className="page-intro__grid"><div><p className="eyebrow">SECCIÓN / {String(index).padStart(2, "0")} — ARCHIVO TEMÁTICO</p><h1>{section.name}<span className="heading-star">*</span></h1></div><div className="page-intro__side"><span>RUTA / {section.slug.toUpperCase()}</span><p>Artículos, guías y notas reunidos alrededor de {section.name}.</p><span className="page-intro__count">{String(section.posts.length).padStart(2, "0")} PUBLICACIONES -&gt;</span></div></div>
      </div>
      <div className="filter-strip"><span>OTRAS SECCIONES</span><nav aria-label="Otras secciones"><Link href="/articulos" className="filter-chip">TODO</Link>{sections.map(item => <Link key={item.slug} href={`/secciones/${item.slug}`} className={`filter-chip ${item.slug === section.slug ? "filter-chip--active" : ""}`}>{item.name.toUpperCase()} <sup>{item.posts.length}</sup></Link>)}</nav></div>
      <section className="archive-section"><div className="archive-section__heading"><p className="eyebrow">/ ARTÍCULOS EN ESTA SECCIÓN</p><span>ORDENADOS POR FECHA v</span></div><div className="post-grid">{section.posts.map(post => <PostPreview key={post.slug} {...post} sectionSlug={section.slug} />)}{section.posts.length % 2 === 1 ? <ArchiveGridFiller context={section.slug} /> : null}</div></section>
    </Container></main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section: slug } = await params;
  const section = getSectionBySlug(slug);
  if (!section) notFound();
  return { title: section.name, description: `Artículos de ${section.name} en Continuous Disintegration.`, alternates: { canonical: canonicalUrl(`/secciones/${section.slug}/`) } };
}

export function generateStaticParams() { return getSections().map(section => ({ section: section.slug })); }
