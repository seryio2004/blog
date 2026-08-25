import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import { getAuthorBySlug, getAuthors, getSectionSlug } from "@/lib/api";
import { withBasePath } from "@/lib/paths";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const postCount =
    author.posts.length === 1
      ? "1 artículo publicado"
      : `${author.posts.length} artículos publicados`;

  return (
    <main className="min-h-screen">
      <Container>
        <header className="py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-lg border border-violet-300/20 bg-violet-950/30 px-4 py-2 text-sm text-violet-100/80 transition-colors hover:border-violet-300/40 hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Volver al inicio
          </Link>

          <div className="grid gap-8 rounded-3xl border border-sky-300/15 bg-slate-950/55 p-6 shadow-2xl shadow-sky-950/20 backdrop-blur-xl md:grid-cols-[auto_1fr] md:items-center md:p-10">
            <img
              src={withBasePath(author.picture)}
              alt={`Foto de ${author.name}`}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-sky-300/15 md:h-36 md:w-36"
            />

            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300/70">
                Autor
              </p>
              <h1 className="text-5xl font-bold tracking-tighter md:text-7xl">
                {author.name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-200/80">
                {author.bio}
              </p>
              <p className="mt-4 text-sm font-medium text-sky-200/60">
                {postCount}
              </p>
            </div>
          </div>
        </header>

        <section className="pb-24" aria-labelledby="author-posts-title">
          <h2 id="author-posts-title" className="mb-10 text-3xl font-bold">
            Artículos de {author.name}
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {author.posts.map((post) => (
              <PostPreview
                key={post.slug}
                title={post.title}
                coverImage={post.coverImage}
                date={post.date}
                excerpt={post.excerpt}
                author={post.author}
                slug={post.slug}
                section={post.section}
                sectionSlug={getSectionSlug(post.section)}
              />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  return {
    title: `${author.name} | Autores`,
    description: author.bio,
  };
}

export function generateStaticParams() {
  return getAuthors().map((author) => ({
    slug: author.slug,
  }));
}
