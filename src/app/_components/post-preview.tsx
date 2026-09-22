import { type Author } from "@/interfaces/author";
import { type PostLanguage } from "@/interfaces/post";
import Link from "next/link";
import Avatar from "./avatar";
import DateFormatter from "./date-formatter";
import { LanguageBadge } from "./language-badge";
import { TechnicalCover } from "./technical-cover";
import { copy, routes, type Locale } from "@/lib/i18n";

type Props = {
  title: string; date: string; excerpt: string; author: Author;
  slug: string; language: PostLanguage; section?: string; sectionSlug?: string; compact?: boolean;
  locale?: Locale;
};

export function PostPreview({ title, date, excerpt, author, slug, language, section, sectionSlug, locale = "es" }: Props) {
  const href = routes(locale);
  return (
    <article className="post-card" lang={language}>
      <TechnicalCover title={title} section={section} slug={slug} locale={locale} />
      <div className="post-card__content">
        <div className="post-card__meta">
          {section && sectionSlug ? <Link href={href.section(sectionSlug)} className="section-tag">{section}</Link> : <span className="section-tag">{copy[locale].editorial}</span>}
          <span className="meta-separator">/</span><DateFormatter dateString={date} locale={locale} /><LanguageBadge language={language} />
        </div>
        <h3><Link href={href.post(slug)}>{title}<span aria-hidden="true" className="post-card__title-arrow">-&gt;</span></Link></h3>
        <p className="post-card__excerpt">{excerpt}</p>
        <div className="post-card__footer"><Avatar name={author.name} picture={author.picture} locale={locale} /><span className="post-card__read">{copy[locale].readArticle} <span aria-hidden="true">-&gt;</span></span></div>
      </div>
    </article>
  );
}
