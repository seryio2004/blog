import Container from "@/app/_components/container";
import { ArticlesList } from "@/app/_components/articles-list";
import { getAllPosts, getSectionSlug, getSections } from "@/lib/api";
import Link from "next/link";

export const metadata = { title: "Todos los artículos", description: "Archivo completo de artículos de Continuous Disintegration." };

export default function ArticlesPage() {
  const posts = getAllPosts().map(post => ({
    ...post,
    sectionSlug: getSectionSlug(post.section),
  }));
  const sections = getSections();
  return (
    <main>
      <Container>
        <div className="page-intro">
          <Link href="/" className="breadcrumb">&lt;- VOLVER AL INICIO</Link>
          <div className="page-intro__grid"><div><p className="eyebrow">ARCHIVO / TODOS LOS REGISTROS</p><h1>Todos los<br /><em>artículos.</em></h1></div><div className="page-intro__side"><span>INDEX_002</span><p>Un registro de ideas en proceso. Busca una ruta, elige una lectura y sigue el hilo.</p><span className="page-intro__count">{String(posts.length).padStart(2, "0")} ENTRADAS DISPONIBLES -&gt;</span></div></div>
        </div>
        <div className="filter-strip"><span>EXPLORAR POR TEMA</span><nav aria-label="Filtrar por sección"><Link href="/articulos" className="filter-chip filter-chip--active">TODO <sup>{posts.length}</sup></Link>{sections.map(section => <Link key={section.slug} href={`/secciones/${section.slug}`} className="filter-chip">{section.name.toUpperCase()} <sup>{section.posts.length}</sup></Link>)}</nav></div>
        <section className="archive-section"><ArticlesList posts={posts} /></section>
      </Container>
    </main>
  );
}
