import Container from "@/app/_components/container";
import { ArticlesList } from "@/app/_components/articles-list";
import { getAllPosts } from "@/lib/api";
import Link from "next/link";

export default function ArticlesPage() {
  const posts = getAllPosts().map(
    ({ slug, title, coverImage, date, excerpt, author, language }) => ({
      slug,
      title,
      coverImage,
      date,
      excerpt,
      author,
      language,
    }),
  );

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
          <h1 className="text-5xl font-bold tracking-tighter md:text-7xl">
            Todos los artículos
          </h1>
        </header>

        <section className="pb-24">
          <ArticlesList posts={posts} />
        </section>
      </Container>
    </main>
  );
}
