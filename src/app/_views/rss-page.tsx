import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/app/_components/container";
import { PageChrome } from "@/app/_components/page-chrome";
import DateFormatter from "@/app/_components/date-formatter";
import { RssSubscribe } from "@/app/_components/rss-subscribe";
import { getAllPosts } from "@/lib/api";
import { routes, type Locale } from "@/lib/i18n";
import { withBasePath } from "@/lib/paths";
import { canonicalUrl } from "@/lib/site";
import { buildPageSocialMetadata } from "@/lib/seo";

const labels = {
  es: {
    back: "← VOLVER AL INICIO", eyebrow: "SIGUE EL HILO / RSS", title: "Mis artículos,", titleEnd: "a tu ritmo.",
    intro: "Llévate el blog a tu lector RSS y encuentra mis nuevas publicaciones junto a las webs que ya sigues.", count: "ARTÍCULOS EN EL FEED",
    channel: "01 / TU CONEXIÓN CON EL BLOG", subscribe: "Un feed, todas mis notas.",
    description: "El RSS reúne mis artículos en una dirección que tu lector consulta para encontrar nuevas entradas. Tú eliges cuándo leerlas.",
    language: "Este feed contiene los artículos en español.", other: "¿Prefieres leer en inglés?", otherLink: "Ver el feed en inglés",
    how: "02 / CÓMO SUSCRIBIRTE", howTitle: "Tres pasos y listo.",
    steps: [
      { title: "Copia la dirección", note: "Usa el botón de esta página o selecciona la URL del feed." },
      { title: "Añádela a tu lector", note: "Abre tu lector RSS, busca la opción de añadir un feed y pega la dirección." },
      { title: "Lee cuando te apetezca", note: "Tu lector comprobará las nuevas entradas y las reunirá con tus otras suscripciones." },
    ],
    note: "No necesitas darme tu correo ni crear una cuenta en este blog. La suscripción se gestiona desde tu lector.",
    latest: "03 / LO QUE ENCONTRARÁS EN EL FEED", latestTitle: "Últimas publicaciones.", all: "Ver todos los artículos",
    meta: "Sigue los artículos de Continuous Disintegration por RSS. Copia la dirección del feed y añádela a tu lector favorito.",
  },
  en: {
    back: "← BACK TO HOME", eyebrow: "FOLLOW THE THREAD / RSS", title: "My articles,", titleEnd: "at your pace.",
    intro: "Bring the blog into your RSS reader and find my latest posts alongside the websites you already follow.", count: "ARTICLES IN THE FEED",
    channel: "01 / YOUR CONNECTION TO THE BLOG", subscribe: "One feed, all my notes.",
    description: "RSS collects my articles at an address your reader checks for new posts. You decide when to read them.",
    language: "This feed contains the articles in English.", other: "Prefer reading in Spanish?", otherLink: "View the Spanish feed",
    how: "02 / HOW TO SUBSCRIBE", howTitle: "Three steps to get started.",
    steps: [
      { title: "Copy the address", note: "Use the button on this page or select the feed URL." },
      { title: "Add it to your reader", note: "Open your RSS reader, find the add-feed option and paste the address." },
      { title: "Read when you like", note: "Your reader will check for new posts and collect them alongside your other subscriptions." },
    ],
    note: "You do not need to share your email with me or create an account on this blog. Manage the subscription in your reader.",
    latest: "03 / WHAT YOU WILL FIND IN THE FEED", latestTitle: "Latest posts.", all: "Browse all articles",
    meta: "Follow Continuous Disintegration via RSS. Copy the feed address and add it to your favorite reader.",
  },
} as const;

export function RssPage({ locale }: { locale: Locale }) {
  const text = labels[locale];
  const href = routes(locale);
  const otherLocale = locale === "es" ? "en" : "es";
  const feedPath = locale === "es" ? "/feed.xml" : "/en/feed.xml";
  const posts = getAllPosts(locale);
  return <PageChrome locale={locale} alternateHref={routes(otherLocale).rss}><main className="rss-page"><Container>
    <div className="page-intro">
      <Link className="breadcrumb" href={href.home}>{text.back}</Link>
      <div className="page-intro__grid"><div><p className="eyebrow">{text.eyebrow}</p><h1>{text.title}<br /><em>{text.titleEnd}</em></h1></div><div className="page-intro__side"><span>FEED / {locale.toUpperCase()}</span><p>{text.intro}</p><span className="page-intro__count">{String(posts.length).padStart(2, "0")} {text.count}</span></div></div>
    </div>
    <section className="rss-channel" aria-labelledby="rss-subscribe-title">
      <div><p className="eyebrow">{text.channel}</p><h2 id="rss-subscribe-title">{text.subscribe}</h2><p>{text.description}</p><p className="rss-channel__language">{text.language}</p><Link className="text-link" href={routes(otherLocale).rss}>{text.other} {text.otherLink} →</Link></div>
      <div className="rss-window"><div className="rss-window__bar"><span>~/continuous-disintegration</span><span>RSS / {locale.toUpperCase()}</span></div><div className="rss-window__body"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none"/><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/></svg><RssSubscribe url={canonicalUrl(feedPath)} xmlHref={withBasePath(feedPath)} locale={locale}/></div></div>
    </section>
    <section className="rss-instructions" aria-labelledby="rss-how-title"><p className="eyebrow">{text.how}</p><h2 id="rss-how-title">{text.howTitle}</h2><ol>{text.steps.map((step,index)=><li key={step.title}><span aria-hidden="true">/0{index+1}</span><h3>{step.title}</h3><p>{step.note}</p></li>)}</ol><p className="rss-instructions__note">{text.note}</p></section>
    <section className="rss-latest" aria-labelledby="rss-latest-title"><div className="section-heading"><div><p className="eyebrow">{text.latest}</p><h2 id="rss-latest-title">{text.latestTitle}</h2></div><Link className="text-link" href={href.articles}>{text.all} →</Link></div><ul>{posts.slice(0,4).map(post=><li key={post.slug}><Link href={href.post(post.slug)}><span><small>{post.section}</small><strong>{post.title}</strong></span><DateFormatter dateString={post.date} locale={locale}/><span aria-hidden="true">→</span></Link></li>)}</ul></section>
  </Container></main></PageChrome>;
}

export function buildRssMetadata(locale: Locale): Metadata {
  const title = locale === "es" ? "Sigue el blog por RSS" : "Follow the blog via RSS";
  const description = labels[locale].meta;
  const es = canonicalUrl("/rss/");
  const en = canonicalUrl("/en/rss/");
  return { title, description, alternates: { canonical: locale === "es" ? es : en, languages: { es, en, "x-default": es } }, ...buildPageSocialMetadata({locale,title,description,url:locale === "es" ? es : en}) };
}
