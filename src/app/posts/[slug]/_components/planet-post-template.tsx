import Alert from "@/app/_components/alert";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { type Post } from "@/interfaces/post";
import { PlanetPostBackground } from "./planet-post-background";
import styles from "./planet-post-template.module.css";

type PlanetPost = Pick<
  Post,
  "title" | "coverImage" | "date" | "author" | "preview"
>;

type Props = {
  post: PlanetPost;
  content: string;
};

export function PlanetPostTemplate({ post, content }: Props) {
  return (
    <main className={styles.page}>
      <PlanetPostBackground />

      <div className={styles.notice}>
        <Alert preview={post.preview} />
      </div>

      <div className={styles.content}>
        <Container>
          <div className={styles.siteHeader}>
            <Header />
          </div>

          <article className={`${styles.article} mx-auto mb-32 max-w-6xl`}>
            <PostHeader
              title={post.title}
              coverImage={post.coverImage}
              date={post.date}
              author={post.author}
            />
            <PostBody content={content} />
          </article>
        </Container>
      </div>
    </main>
  );
}
