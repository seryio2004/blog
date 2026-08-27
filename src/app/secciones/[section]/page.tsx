import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import { getSectionBySlug, getSections } from "@/lib/api";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    section: string;
  }>;
};

export default async function SectionPage({ params }: Props) {
  const { section: sectionSlug } = await params;
  const section = getSectionBySlug(sectionSlug);

  if (!section) {
    notFound();
  }

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
            {section.name}
          </h1>
          <p className="mt-6 text-lg text-violet-100/70">
            {section.posts.length === 1
              ? "1 artículo en esta sección"
              : `${section.posts.length} artículos en esta sección`}
          </p>
        </header>

        <section className="pb-24">
          <h2 className="mb-10 text-3xl font-bold">Todos los artículos</h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {section.posts.map((post) => (
              <PostPreview
                key={post.slug}
                title={post.title}
                coverImage={post.coverImage}
                date={post.date}
                excerpt={post.excerpt}
                author={post.author}
                slug={post.slug}
                language={post.language}
              />
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section: sectionSlug } = await params;
  const section = getSectionBySlug(sectionSlug);

  if (!section) {
    notFound();
  }

  return {
    title: `${section.name} | Blog`,
    description: `Artículos de la sección ${section.name}.`,
  };
}

export function generateStaticParams() {
  return getSections().map((section) => ({
    section: section.slug,
  }));
}
