"use client";

import type { Post } from "@/interfaces/post";
import { useEffect, useState } from "react";
import { ArchiveGridFiller } from "./archive-grid-filler";
import { ArticleSortSelect } from "./article-sort-select";
import { PostPreview } from "./post-preview";
import { copy, type Locale } from "@/lib/i18n";

type ArticleListPost = Pick<
  Post,
  "slug" | "title" | "date" | "excerpt" | "author" | "language" | "section"
> & { sectionSlug: string };

type ArticleOrder = "newest" | "oldest";

type Props = {
  posts: ArticleListPost[];
  locale?: Locale;
};

export function ArticlesList({ posts, locale = "es" }: Props) {
  const [order, setOrder] = useState<ArticleOrder>("newest");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const oldValue = locale === "es" ? searchParams.get("orden") === "antiguos" : searchParams.get("order") === "oldest";
    setOrder(oldValue ? "oldest" : "newest");
  }, [locale]);

  const changeOrder = (nextOrder: ArticleOrder) => {
    setOrder(nextOrder);

    const url = new URL(window.location.href);

    const key = locale === "es" ? "orden" : "order";
    const oldValue = locale === "es" ? "antiguos" : "oldest";
    if (nextOrder === "oldest") {
      url.searchParams.set(key, oldValue);
    } else {
      url.searchParams.delete(key);
    }

    window.history.replaceState(null, "", url);
  };

  const orderedPosts = order === "oldest" ? [...posts].reverse() : posts;

  return (
    <>
      <div className="archive-section__heading">
        <p className="eyebrow">{copy[locale].publicationIndex}</p>
        <ArticleSortSelect value={order} onChange={changeOrder} locale={locale} />
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
            locale={locale}
          />
        ))}
        {orderedPosts.length % 2 === 1 ? <ArchiveGridFiller context={locale === "es" ? "índice" : "index"} locale={locale} /> : null}
      </div>
    </>
  );
}
