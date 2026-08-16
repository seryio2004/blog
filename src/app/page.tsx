import Container from "@/app/_components/container";
import { PostPreview } from "@/app/_components/post-preview";
import { getAllPosts } from "@/lib/api";

export default function Home() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen">
      <Container>
        <header className="py-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            Niggi blog
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-neutral-600">
            Articulos sobre programación, electronica, diseño web y todas las paridas que hacemos los informaticos.
            Todo des el punto de vista de dos pringados recien salidos de la carrera.
          </p>
        </header>

        <section className="pb-24">
          <h2 className="mb-10 text-3xl font-bold">
            Últimos artículos
          </h2>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            {posts.map((post) => (
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
  )
}
