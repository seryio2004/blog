"use client";

import type { Post } from "@/interfaces/post";
import { useEffect, useState } from "react";
import { ArchiveGridFiller } from "./archive-grid-filler";
import { ArticleSortSelect } from "./article-sort-select";
import { PostPreview } from "./post-preview";

type ArticleListPost = Pick<
  Post,
  "slug" | "title" | "date" | "excerpt" | "author" | "language" | "section"
> & { sectionSlug: string };

type ArticleOrder = "recientes" | "antiguos";

type Props = {
  posts: ArticleListPost[];
};

export function ArticlesList({ posts }: Props) {
  const [order, setOrder] = useState<ArticleOrder>("recientes");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setOrder(searchParams.get("orden") === "antiguos" ? "antiguos" : "recientes");
  }, []);

  const changeOrder = (nextOrder: ArticleOrder) => {
    setOrder(nextOrder);

    const url = new URL(window.location.href);

    if (nextOrder === "antiguos") {
      url.searchParams.set("orden", "antiguos");
    } else {
      url.searchParams.delete("orden");
    }

    window.history.replaceState(null, "", url);
  };

  const orderedPosts = order === "antiguos" ? [...posts].reverse() : posts;

  return (
    <>
      <div className="archive-section__heading">
        <p className="eyebrow">/ ÍNDICE DE PUBLICACIONES</p>
        <ArticleSortSelect value={order} onChange={changeOrder} />
      </div>

      <div className="post-grid">
        {orderedPosts.map((post) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            date={post.date}
            excerpt={post.excerpt}
            author={post.author}
            slug={post.slug}
            language={post.language}
            section={post.section}
            sectionSlug={post.sectionSlug}
          />
        ))}
        {orderedPosts.length % 2 === 1 ? <ArchiveGridFiller context="índice" /> : null}
      </div>
    </>
  );
}
