import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getSectionSlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import Container from "@/app/_components/container";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { PageChrome } from "@/app/_components/page-chrome";
import { getAuthorSlug } from "@/lib/authors";
import {
  canonicalUrl,
  siteAuthorGithub,
  siteAuthorX,
  siteAuthorXUrl,
  siteName,
} from "@/lib/site";
import { routes, type Locale } from "@/lib/i18n";
import { getPostSocialImage } from "@/lib/post-social-image";

type Params = { params: Promise<{ slug: string }> };

export async function PostPageContent({ params, locale }: Params & { locale: Locale }) {
  const { slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();
  const content = await markdownToHtml(post.content || "", locale);
  const readingMinutes = Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 220));
  const alternateHref = routes(locale === "es" ? "en" : "es").post(post.slug);
  const text = locale === "es" ? { workshop: "DESDE EL TALLER / 001", note: "Aquí voy dejando lo que aprendo, lo que rompo y cómo termino arreglándolo.", talk: "¿HABLAMOS?", contact: "Datos de contacto", email: "CORREO" } : { workshop: "FROM THE WORKSHOP / 001", note: "This is where I leave what I learn, what I break and how I eventually fix it.", talk: "LET'S TALK", contact: "Contact details", email: "EMAIL" };
  const articleUrl = canonicalUrl(`${routes(locale).post(post.slug)}/`);
  const authorUrl = canonicalUrl(`${routes(locale).author(getAuthorSlug(post.author.name))}/`);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    headline: post.title,
    description: post.excerpt,
    image: [getPostSocialImage(post, locale).url],
    datePublished: post.date,
    dateModified: post.updatedDate ?? post.date,
    inLanguage: locale,
    articleSection: post.section,
    wordCount: post.content.trim().split(/\s+/).length,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: authorUrl,
      sameAs: [siteAuthorGithub, siteAuthorXUrl],
    },
    publisher: { "@type": "Person", name: post.author.name, url: authorUrl },
    isPartOf: { "@type": "Blog", name: siteName, url: canonicalUrl(locale === "es" ? "/" : "/en/") },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
  };

  return <PageChrome locale={locale} alternateHref={alternateHref}><main className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} /><Container><article lang={post.language}>
    <PostHeader title={post.title} date={post.date} updatedDate={post.updatedDate} author={post.author} language={post.language} section={post.section} sectionSlug={getSectionSlug(post.section)} readingMinutes={readingMinutes} shareUrl={articleUrl} locale={locale} />
    <div className="article-layout"><aside className="article-aside"><span>{text.workshop}</span><p>{text.note}</p><span className="article-aside__line" /><span>{text.talk}</span><nav className="article-aside__contacts" aria-label={text.contact}><a href="https://x.com/seryioDev" target="_blank" rel="noreferrer"><span>X</span><span>@seryioDev</span></a><a href="mailto:rodriguezsergiomartinez@gmail.com"><span>{text.email}</span><span>rodriguezsergiomartinez@gmail.com</span></a><a href="https://github.com/seryio2004" target="_blank" rel="noreferrer"><span>GITHUB</span><span>@seryio2004</span></a></nav></aside><PostBody content={content} locale={locale} /></div>
  </article></Container></main></PageChrome>;
}

export async function buildPostMetadata({ params, locale }: Params & { locale: Locale }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();
  const es = canonicalUrl(routes("es").post(post.slug) + "/");
  const en = canonicalUrl(routes("en").post(post.slug) + "/");
  const canonical = locale === "es" ? es : en;
  const authorUrl = canonicalUrl(`${routes(locale).author(getAuthorSlug(post.author.name))}/`);
  const image = getPostSocialImage(post, locale);

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author.name, url: authorUrl }],
    alternates: { canonical, languages: { es, en, "x-default": es } },
    openGraph: {
      type: "article",
      siteName,
      title: post.title,
      description: post.excerpt,
      url: canonical,
      locale: locale === "es" ? "es_ES" : "en_GB",
      alternateLocale: locale === "es" ? "en_GB" : "es_ES",
      publishedTime: post.date,
      modifiedTime: post.updatedDate ?? post.date,
      authors: [authorUrl],
      section: post.section,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      creator: siteAuthorX,
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}
