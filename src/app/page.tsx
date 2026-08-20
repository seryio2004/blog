import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import { getAllPosts, getSectionSlug, getSections } from "@/lib/api";
import Link from "next/link";

export default function Home() {
  const sections = getSections();
  const latestPosts = getAllPosts().slice(0, 4);

  return (
    <main className="min-h-screen">
      <Container>
        <header className="py-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            Type shit
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-neutral-600">
            Artículos sobre programación, electrónica, diseño web y todas las
            paridas que hacemos los informáticos.
          </p>
        </header>

        <section className="pb-20" aria-labelledby="latest-posts-title">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 id="latest-posts-title" className="text-3xl font-bold">
              Últimos artículos
            </h2>
            <Link
              href="/articulos"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-100/80 hover:text-white"
            >
              Ver todos
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {latestPosts.map((post) => (
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

        <section className="pb-20" aria-labelledby="sections-title">
          <h2 id="sections-title" className="mb-8 text-3xl font-bold">
            Explora por secciones
          </h2>
          <nav className="mt-10" aria-label="Secciones del blog">
            <ul className="flex flex-wrap gap-3">
              {sections.map((section) => (
                <li key={section.slug}>
                  <Link
                    href={`/secciones/${section.slug}`}
                    className="inline-flex rounded-full border border-violet-300/20 bg-violet-950/30 px-4 py-2 text-sm font-medium text-violet-100/80 transition-colors hover:border-violet-300/40 hover:text-white"
                  >
                    {section.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/articulos"
                  className="inline-flex rounded-full border border-violet-300/20 bg-violet-950/30 px-4 py-2 text-sm font-medium text-violet-100/80 transition-colors hover:border-violet-300/40 hover:text-white"
                >
                  Todos los artículos
                </Link>
              </li>
            </ul>
          </nav>
        </section>

        {sections.map((section) => {
          const post = section.latestPost;

          return (
            <section key={section.slug} className="pb-20">
              <h2 className="mb-10 text-3xl font-bold">{section.name}</h2>

              <div className="grid max-w-3xl grid-cols-1 gap-8">
                <PostPreview
                  title={post.title}
                  coverImage={post.coverImage}
                  date={post.date}
                  excerpt={post.excerpt}
                  author={post.author}
                  slug={post.slug}
                />
              </div>

              <Link
                href={`/secciones/${section.slug}`}
                className="mt-8 inline-flex items-center gap-2 rounded-lg border border-violet-300/20 bg-violet-950/30 px-4 py-2 text-sm font-medium text-violet-100/80 transition-colors hover:border-violet-300/40 hover:text-white"
              >
                Ver más sobre {section.name}
                <span aria-hidden="true">→</span>
              </Link>
            </section>
          );
        })}
      </Container>
    </main>
  );
}
