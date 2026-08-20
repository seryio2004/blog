import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import { ArticleSortSelect } from "@/app/_components/article-sort-select";
import { getAllPosts } from "@/lib/api";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ orden?: string }>;
};

export default async function ArticlesPage({ searchParams }: Props) {
  const { orden } = await searchParams;
  const currentOrder = orden === "antiguos" ? "antiguos" : "recientes";
  const posts = getAllPosts();
  const orderedPosts = currentOrder === "antiguos" ? [...posts].reverse() : posts;

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
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-bold">Artículos</h2>
            <ArticleSortSelect value={currentOrder} />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {orderedPosts.map((post) => (
              <PostPreview
                key={post.slug}
                title={post.title}
                coverImage={post.coverImage}
                date={post.date}
                excerpt={post.excerpt}
                author={post.author}
                slug={post.slug}
              />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
