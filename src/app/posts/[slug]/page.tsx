import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getSectionSlug } from "@/lib/api";
import { CMS_NAME } from "@/lib/constants";
import markdownToHtml from "@/lib/markdownToHtml";
import Alert from "@/app/_components/alert";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { PostLiquidBackground } from "@/app/_components/post-liquid-background";
import { withBasePath } from "@/lib/paths";
import { PlanetPostTemplate } from "./_components/planet-post-template";
import { ForgejoPostTemplate } from "./_components/forgejo-post-template";

const PLANET_TEMPLATE_SLUG = "hello-world";

type PostTheme = "liquid" | "planets" | "forgejo";

const SECTION_THEMES: Partial<Record<string, PostTheme>> = {
  python: "planets",
  forgejo: "forgejo",
};


function getPostThemeBySection(section: string): PostTheme {
  const sectionSlug = getSectionSlug(section);

  return SECTION_THEMES[sectionSlug] ?? "liquid";
}

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  const theme = getPostThemeBySection(post.section);

  if (post.slug === PLANET_TEMPLATE_SLUG || theme === "planets") {
    return <PlanetPostTemplate post={post} content={content} />;
  }

  if (theme === "forgejo") {
    return <ForgejoPostTemplate post={post} content={content} />;
  }

  return (
    <main className="post-page">
      <PostLiquidBackground />
      <Alert preview={post.preview} />
      <Container>
        <Header />
        <article
          lang={post.language}
          className="mx-auto mb-32 max-w-6xl"
        >
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
            language={post.language}
          />
          <PostBody content={content} />
        </article>
      </Container>
    </main>
  );
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | Next.js Blog Example with ${CMS_NAME}`;

  return {
    title,
    openGraph: {
      title,
      images: [withBasePath(post.ogImage.url)],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
