import Container from "@/app/_components/container";
import { PageChrome } from "@/app/_components/page-chrome";
import { PostPreview } from "@/app/_components/post-preview";
import SocialSidebar from "@/app/_components/social-sidebar";
import { OrbitArcade } from "@/app/_components/orbit-arcade";
import { getAllPosts, getSectionSlug, getSections } from "@/lib/api";
import { copy, routes, type Locale } from "@/lib/i18n";
import { canonicalUrl, siteAuthor, siteAuthorGithub, siteAuthorXUrl, siteName } from "@/lib/site";
import Link from "next/link";

const homeCopy = {
  es: {
    alternate: "/en", journal: "MI CUADERNO DE PROYECTOS", explore: "APRENDIENDO SOBRE LA MARCHA",
    eyebrow: "LO QUE PRUEBO, APRENDO Y VOY CONTANDO", lead: "Comparto lo que voy aprendiendo sobre programación, electrónica y los proyectos que monto por mi cuenta. También lo que se rompe y cómo termino arreglándolo.",
    sectionsId: "secciones", exploreArticles: "Explorar artículos", viewSections: "Ver secciones", topics: "Temas del blog", manifest: "$ cat manifiesto.txt", radar: "// Lo que tengo entre manos", continue: "// SIGUE EXPLORANDO_",
    tinkering: "SIGO TRASTEANDO", articles: "ARTÍCULOS", sections: "SECCIONES", scroll: "BAJA Y ECHA UN OJO v", mobileSignal: "* SIGO TRASTEANDO. BAJA Y ECHA UN OJO v",
    recently: "01 / LO ÚLTIMO QUE HE ESCRITO", archiveA: "En mi", archiveB: "archivo", all: "Todos los artículos", routes: "02 / RUTAS DE EXPLORACIÓN", by: "Por", sectionWord: "secciones", note: "Mis notas, herramientas y experimentos, ordenados por tema.",
    behind: "// DETRÁS DE LA PANTALLA", dismantleA: "Siempre tengo", dismantleB: "algo por", dismantleC: "probar.", about: "Soy Sergio. Me gusta programar, cacharrear con electrónica y montar mi propia infraestructura. Aquí dejo guías, proyectos y los problemas que voy resolviendo por el camino.",
  },
  en: {
    alternate: "/", journal: "MY PROJECT NOTEBOOK", explore: "LEARNING AS I GO",
    eyebrow: "WHAT I TRY, LEARN AND WRITE ABOUT", lead: "I share what I learn about programming, electronics and the projects I build on my own. Including what breaks and how I eventually fix it.",
    sectionsId: "sections", exploreArticles: "Explore articles", viewSections: "View sections", topics: "Blog topics", manifest: "$ cat manifesto.txt", radar: "// What I am working on", continue: "// KEEP EXPLORING_",
    tinkering: "I KEEP TINKERING", articles: "ARTICLES", sections: "SECTIONS", scroll: "SCROLL DOWN AND HAVE A LOOK v", mobileSignal: "* I KEEP TINKERING. SCROLL DOWN AND HAVE A LOOK v",
    recently: "01 / MY LATEST WRITING", archiveA: "In my", archiveB: "archive", all: "All articles", routes: "02 / EXPLORATION ROUTES", by: "By", sectionWord: "section", note: "My notes, tools and experiments, organized by topic.",
    behind: "// BEHIND THE SCREEN", dismantleA: "I always have", dismantleB: "something to", dismantleC: "try.", about: "I am Sergio. I enjoy programming, tinkering with electronics and running my own infrastructure. Here I write about my projects, share guides and work through the problems I encounter along the way.",
  },
} as const;

export function HomePage({ locale }: { locale: Locale }) {
  const text = homeCopy[locale];
  const href = routes(locale);
  const sections = getSections(locale);
  const posts = getAllPosts(locale);
  const homeUrl = canonicalUrl(locale === "en" ? "/en/" : "/");
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${homeUrl}#website`,
    name: siteName,
    description: copy[locale].siteDescription,
    url: homeUrl,
    inLanguage: locale,
    publisher: {
      "@type": "Person",
      name: siteAuthor,
      url: canonicalUrl(`${routes(locale).author("sergio-rodriguez")}/`),
      sameAs: [siteAuthorGithub, siteAuthorXUrl],
    },
  };

  return <PageChrome locale={locale} alternateHref={text.alternate}>
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />
      <Container>
        <div className="index-strip"><span>{text.journal} <span className="index-strip__spark">*</span> EST. 2026</span><span>INDEX / 001 — <span className="index-strip__muted">{text.explore}</span></span></div>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__copy"><p className="eyebrow"><span className="eyebrow__square" /> {text.eyebrow}</p><h1 id="home-title">Continuous<br /><span>Disintegration</span><b aria-hidden="true">_</b></h1><p className="home-hero__lead">{text.lead}</p><div className="home-hero__actions"><Link href={href.articles} className="button button--dark">{text.exploreArticles} <span aria-hidden="true">-&gt;</span></Link><a href={`#${text.sectionsId}`} className="text-link">{text.viewSections} <span aria-hidden="true">v</span></a></div></div>
          <div className="hero-terminal" aria-label={text.topics}><div className="hero-terminal__bar"><span><i /><i /><i /></span><span>~/continuous-disintegration</span><span>×</span></div><div className="hero-terminal__body"><p className="hero-terminal__prompt">{text.manifest}<span className="hero-terminal__cursor">_</span></p><div className="hero-terminal__ascii" aria-hidden="true"><span>┌────────────────────┐</span><span>│  C / D     ◎  01   │</span><span>│   ▒▒▒▒▒▒▒▒▒▒▒▒    │</span><span>│   BUILD / BREAK    │</span><span>└────────────────────┘</span></div><p className="hero-terminal__comment">{text.radar}</p><ul>{sections.map((section, index) => <li key={section.slug}><span>0{index + 1}</span> <Link href={href.section(section.slug)}>{section.name.toLowerCase()}<span aria-hidden="true">-&gt;</span></Link></li>)}</ul><p className="hero-terminal__end">{text.continue}</p></div></div>
        </section>
        <div className="signal-strip"><span className="signal-strip__desktop">* &nbsp; {text.tinkering}</span><span className="signal-strip__desktop">{text.articles} {String(posts.length).padStart(2, "0")}</span><span className="signal-strip__desktop">{text.sections} {String(sections.length).padStart(2, "0")}</span><span className="signal-strip__desktop">{text.scroll}</span><span className="signal-strip__mobile">{text.mobileSignal}</span></div>
        <section className="content-section" aria-labelledby="latest-title"><div className="section-heading"><div><p className="eyebrow">{text.recently}</p><h2 id="latest-title">{text.archiveA} <em>{text.archiveB}</em><span className="heading-star">*</span></h2></div><Link href={href.articles} className="text-link">{text.all} <span aria-hidden="true">-&gt;</span></Link></div><div className="post-grid">{posts.slice(0, 4).map((post) => <PostPreview key={post.slug} {...post} sectionSlug={getSectionSlug(post.section)} locale={locale} />)}</div></section>
        <OrbitArcade locale={locale} />
        <section className="content-section section-browser" id={text.sectionsId} aria-labelledby="sections-title"><div className="section-heading"><div><p className="eyebrow">{text.routes}</p><h2 id="sections-title">{text.by} <em>{text.sectionWord}</em><span className="heading-star">*</span></h2></div><p className="section-heading__note">{text.note}</p></div><div className="section-browser__list">{sections.map((section, index) => <Link key={section.slug} href={href.section(section.slug)} className="section-row"><span className="section-row__number">/{String(index + 1).padStart(2, "0")}</span><span className="section-row__name">{section.name}</span><span className="section-row__count">{String(section.posts.length).padStart(2, "0")} {text.articles}</span><span className="section-row__arrow" aria-hidden="true">-&gt;</span></Link>)}</div></section>
        <section className="about-band"><div><p className="eyebrow">{text.behind}</p><h2>{text.dismantleA}<br />{text.dismantleB} <em>{text.dismantleC}</em></h2></div><div><p>{text.about}</p><SocialSidebar locale={locale} /></div></section>
      </Container>
    </main>
  </PageChrome>;
}
