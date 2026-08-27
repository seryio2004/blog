"use client";

import type { Post } from "@/interfaces/post";
import { useEffect, useState } from "react";
import { ArticleSortSelect } from "./article-sort-select";
import { PostPreview } from "./post-preview";

type ArticleListPost = Pick<
  Post,
  "slug" | "title" | "coverImage" | "date" | "excerpt" | "author" | "language"
>;

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
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold">Artículos</h2>
        <ArticleSortSelect value={order} onChange={changeOrder} />
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
            language={post.language}
          />
        ))}
      </div>
    </>
  );
}
