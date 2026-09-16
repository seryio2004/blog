import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getSectionSlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import Container from "@/app/_components/container";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { withBasePath } from "@/lib/paths";

type Params = { params: Promise<{ slug: string }> };

export default async function Post({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const content = await markdownToHtml(post.content || "");
  const readingMinutes = Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 220));

  return (
    <main className="article-page">
      <Container>
        <article lang={post.language}>
          <PostHeader title={post.title} date={post.date} author={post.author} language={post.language} section={post.section} sectionSlug={getSectionSlug(post.section)} readingMinutes={readingMinutes} />
          <div className="article-layout">
            <aside className="article-aside"><span>CONTENIDO / 001</span><p>Notas de campo, decisiones técnicas y aprendizajes del proceso.</p><span className="article-aside__line" /><span>CD_ARCHIVE</span></aside>
            <PostBody content={content} />
          </div>
        </article>
      </Container>
    </main>
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  return { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, images: [withBasePath(post.ogImage.url)] } };
}

export function generateStaticParams() { return getAllPosts().map(post => ({ slug: post.slug })); }
