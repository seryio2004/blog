import { type Author } from "@/interfaces/author";
import { type PostLanguage } from "@/interfaces/post";
import Link from "next/link";
import Avatar from "./avatar";
import DateFormatter from "./date-formatter";
import { LanguageBadge } from "./language-badge";
import { TechnicalCover } from "./technical-cover";

type Props = {
  title: string; date: string; excerpt: string; author: Author;
  slug: string; language: PostLanguage; section?: string; sectionSlug?: string; compact?: boolean;
};

export function PostPreview({ title, date, excerpt, author, slug, language, section, sectionSlug }: Props) {
  return (
    <article className="post-card" lang={language}>
      <TechnicalCover title={title} section={section} slug={slug} />
      <div className="post-card__content">
        <div className="post-card__meta">
          {section && sectionSlug ? <Link href={`/secciones/${sectionSlug}`} className="section-tag">{section}</Link> : <span className="section-tag">EDITORIAL</span>}
          <span className="meta-separator">/</span><DateFormatter dateString={date} /><LanguageBadge language={language} />
        </div>
        <h3><Link href={`/posts/${slug}`}>{title}<span aria-hidden="true" className="post-card__title-arrow">-&gt;</span></Link></h3>
        <p className="post-card__excerpt">{excerpt}</p>
        <div className="post-card__footer"><Avatar name={author.name} picture={author.picture} /><span className="post-card__read">LEER ARTÍCULO <span aria-hidden="true">-&gt;</span></span></div>
      </div>
    </article>
  );
}
