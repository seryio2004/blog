import Alert from "@/app/_components/alert";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { type Post } from "@/interfaces/post";
import { ForgejoPostBackground } from "./forgejo-post-background";
import styles from "./forgejo-post-template.module.css";

type ForgejoPost = Pick<
  Post,
  "title" | "coverImage" | "date" | "author" | "preview" | "language"
>;

type Props = {
  post: ForgejoPost;
  content: string;
};

export function ForgejoPostTemplate({ post, content }: Props) {
  return (
    <main className={styles.page}>
      <ForgejoPostBackground />

      <div className={styles.notice}>
        <Alert preview={post.preview} />
      </div>

      <div className={styles.content}>
        <Container>
          <div className={styles.siteHeader}>
            <Header />
          </div>

          <article
            lang={post.language}
            className={`${styles.article} mx-auto mb-32 max-w-6xl`}
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
      </div>
    </main>
  );
}
