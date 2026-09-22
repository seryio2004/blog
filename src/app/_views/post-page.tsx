import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getSectionSlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import Container from "@/app/_components/container";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { PageChrome } from "@/app/_components/page-chrome";
import { withBasePath } from "@/lib/paths";
import { canonicalUrl } from "@/lib/site";
import { routes, type Locale } from "@/lib/i18n";

type Params = { params: Promise<{ slug: string }> };

export async function PostPageContent({ params, locale }: Params & { locale: Locale }) {
  const { slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();
  const content = await markdownToHtml(post.content || "");
  const readingMinutes = Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 220));
  const alternateHref = routes(locale === "es" ? "en" : "es").post(post.slug);
  const text = locale === "es" ? { workshop: "DESDE EL TALLER / 001", note: "Aquí voy dejando lo que aprendo, lo que rompo y cómo termino arreglándolo.", talk: "¿HABLAMOS?", contact: "Datos de contacto", email: "CORREO" } : { workshop: "FROM THE WORKSHOP / 001", note: "This is where I leave what I learn, what I break and how I eventually fix it.", talk: "LET'S TALK", contact: "Contact details", email: "EMAIL" };
  const articleSchema = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, datePublished: post.date, inLanguage: locale, author: { "@type": "Person", name: post.author.name }, url: canonicalUrl(routes(locale).post(post.slug)) };

  return <PageChrome locale={locale} alternateHref={alternateHref}><main className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} /><Container><article lang={post.language}>
    <PostHeader title={post.title} date={post.date} author={post.author} language={post.language} section={post.section} sectionSlug={getSectionSlug(post.section)} readingMinutes={readingMinutes} locale={locale} />
    <div className="article-layout"><aside className="article-aside"><span>{text.workshop}</span><p>{text.note}</p><span className="article-aside__line" /><span>{text.talk}</span><nav className="article-aside__contacts" aria-label={text.contact}><a href="https://x.com/seryioDev" target="_blank" rel="noreferrer"><span>X</span><span>@seryioDev</span></a><a href="mailto:rodriguezsergiomartinez@gmail.com"><span>{text.email}</span><span>rodriguezsergiomartinez@gmail.com</span></a><a href="https://github.com/seryio2004" target="_blank" rel="noreferrer"><span>GITHUB</span><span>@seryio2004</span></a></nav></aside><PostBody content={content} /></div>
  </article></Container></main></PageChrome>;
}

export async function buildPostMetadata({ params, locale }: Params & { locale: Locale }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();
  const es = canonicalUrl(routes("es").post(post.slug) + "/");
  const en = canonicalUrl(routes("en").post(post.slug) + "/");
  return { title: post.title, description: post.excerpt, alternates: { canonical: locale === "es" ? es : en, languages: { es, en, "x-default": es } }, openGraph: { title: post.title, description: post.excerpt, locale: locale === "es" ? "es_ES" : "en_GB", images: [withBasePath(post.ogImage.url)] } };
}
