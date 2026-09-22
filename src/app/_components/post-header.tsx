import Avatar from "./avatar";
import DateFormatter from "./date-formatter";
import { LanguageBadge } from "./language-badge";
import { PostTitle } from "@/app/_components/post-title";
import { type Author } from "@/interfaces/author";
import { type PostLanguage } from "@/interfaces/post";
import { TechnicalCover } from "./technical-cover";
import Link from "next/link";
import { routes, type Locale } from "@/lib/i18n";
import { ShareButton } from "./share-button";

type Props = {
  title: string;
  date: string;
  author: Author;
  language: PostLanguage;
  section?: string;
  sectionSlug?: string;
  readingMinutes: number;
  shareUrl: string;
  locale?: Locale;
};

export function PostHeader({
  title,
  date,
  author,
  language,
  section,
  sectionSlug,
  readingMinutes,
  shareUrl,
  locale = "es",
}: Props) {
  const text = locale === "es" ? {
    back: "<- VOLVER AL ARCHIVO", kicker: "IDEAS / CÓDIGO / PROCESO", reading: "TIEMPO DE LECTURA", min: "MIN",
  } : {
    back: "<- BACK TO ARCHIVE", kicker: "IDEAS / CODE / PROCESS", reading: "READING TIME", min: "MIN",
  };
  return (
    <header className="article-header">
      <Link href={routes(locale).articles} className="breadcrumb">{text.back}</Link>
      <div className="article-header__meta">
        {section && sectionSlug ? <Link href={routes(locale).section(sectionSlug)} className="section-tag">{section}</Link> : null}
        <DateFormatter dateString={date} locale={locale} /><LanguageBadge language={language} />
      </div>
      <PostTitle>{title}</PostTitle>
      <p className="article-header__kicker">{text.kicker} <span>*</span></p>
      <div className="article-header__byline"><Avatar name={author.name} picture={author.picture} locale={locale} /><div className="article-header__byline-actions"><span>{text.reading} / {String(readingMinutes).padStart(2, "0")} {text.min}</span><ShareButton title={title} url={shareUrl} locale={locale} /></div></div>
      <TechnicalCover title={title} section={section} large locale={locale} />
    </header>
  );
}
