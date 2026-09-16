import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import SocialSidebar from "@/app/_components/social-sidebar";
import { OrbitArcade } from "@/app/_components/orbit-arcade";
import { getAllPosts, getSectionSlug, getSections } from "@/lib/api";
import Link from "next/link";

export default function Home() {
  const sections = getSections();
  const posts = getAllPosts();

  return (
    <main>
      <Container>
        <div className="index-strip"><span>INDEPENDENT TECH JOURNAL <span className="index-strip__spark">*</span> EST. 2026</span><span>INDEX / 001 — <span className="index-strip__muted">EXPLORANDO LO QUE VIENE</span></span></div>

        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__copy">
            <p className="eyebrow"><span className="eyebrow__square" /> UN ESPACIO PARA PENSAR EN VOZ ALTA</p>
            <h1 id="home-title">Continuous<br /><span>Disintegration</span><b aria-hidden="true">_</b></h1>
            <p className="home-hero__lead">Ideas sobre programación, electrónica y diseño digital. Apuntes desde el laboratorio de quienes no pueden dejar de experimentar.</p>
            <div className="home-hero__actions"><Link href="/articulos" className="button button--dark">Explorar artículos <span aria-hidden="true">-&gt;</span></Link><a href="#secciones" className="text-link">Ver secciones <span aria-hidden="true">v</span></a></div>
          </div>
          <div className="hero-terminal" aria-label="Temas del blog">
            <div className="hero-terminal__bar"><span><i /><i /><i /></span><span>~/continuous-disintegration</span><span>×</span></div>
            <div className="hero-terminal__body">
              <p className="hero-terminal__prompt">$ cat manifiesto.txt<span className="hero-terminal__cursor">_</span></p>
              <div className="hero-terminal__ascii" aria-hidden="true"><span>┌────────────────────┐</span><span>│  C / D     ◎  01   │</span><span>│   ▒▒▒▒▒▒▒▒▒▒▒▒    │</span><span>│   BUILD / BREAK    │</span><span>└────────────────────┘</span></div>
              <p className="hero-terminal__comment">// Temas en el radar</p>
              <ul>{sections.map((section, index) => <li key={section.slug}><span>0{index + 1}</span> <Link href={`/secciones/${section.slug}`}>{section.name.toLowerCase()}<span aria-hidden="true">-&gt;</span></Link></li>)}</ul>
              <p className="hero-terminal__end">// SIGUE EXPLORANDO_</p>
            </div>
          </div>
        </section>

        <div className="signal-strip">
          <span className="signal-strip__desktop">* &nbsp; SEGUIMOS TRASTEANDO</span>
          <span className="signal-strip__desktop">ARTÍCULOS {String(posts.length).padStart(2, "0")}</span>
          <span className="signal-strip__desktop">SECCIONES {String(sections.length).padStart(2, "0")}</span>
          <span className="signal-strip__desktop">BAJA Y ECHA UN OJO v</span>
          <span className="signal-strip__mobile">* SEGUIMOS TRASTEANDO. BAJA Y ECHA UN OJO v</span>
        </div>

        <section className="content-section" aria-labelledby="latest-title">
          <div className="section-heading"><div><p className="eyebrow">01 / RECIÉN PUBLICADO</p><h2 id="latest-title">En el <em>archivo</em><span className="heading-star">*</span></h2></div><Link href="/articulos" className="text-link">Todos los artículos <span aria-hidden="true">-&gt;</span></Link></div>
          <div className="post-grid">{posts.slice(0, 4).map((post) => <PostPreview key={post.slug} {...post} sectionSlug={getSectionSlug(post.section)} />)}</div>
        </section>

        <OrbitArcade />

        <section className="content-section section-browser" id="secciones" aria-labelledby="sections-title">
          <div className="section-heading"><div><p className="eyebrow">02 / RUTAS DE EXPLORACIÓN</p><h2 id="sections-title">Por <em>secciones</em><span className="heading-star">*</span></h2></div><p className="section-heading__note">Un índice abierto de ideas, herramientas y experimentos.</p></div>
          <div className="section-browser__list">{sections.map((section, index) => <Link key={section.slug} href={`/secciones/${section.slug}`} className="section-row"><span className="section-row__number">/{String(index + 1).padStart(2, "0")}</span><span className="section-row__name">{section.name}</span><span className="section-row__count">{String(section.posts.length).padStart(2, "0")} ARTÍCULOS</span><span className="section-row__arrow" aria-hidden="true">-&gt;</span></Link>)}</div>
        </section>

        <section className="about-band"><div><p className="eyebrow">// DETRÁS DE LA PANTALLA</p><h2>Siempre hay algo<br />nuevo que <em>desmontar.</em></h2></div><div><p>Este blog reúne notas, guías y pruebas sobre las tecnologías que usamos todos los días. Escribimos para aprender, compartir y seguir haciéndonos preguntas.</p><SocialSidebar /></div></section>
      </Container>
    </main>
  );
}
