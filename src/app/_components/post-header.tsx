import Avatar from "./avatar";
import DateFormatter from "./date-formatter";
import { LanguageBadge } from "./language-badge";
import { PostTitle } from "@/app/_components/post-title";
import { type Author } from "@/interfaces/author";
import { type PostLanguage } from "@/interfaces/post";
import { TechnicalCover } from "./technical-cover";
import Link from "next/link";

type Props = {
  title: string;
  date: string;
  author: Author;
  language: PostLanguage;
  section?: string;
  sectionSlug?: string;
  readingMinutes: number;
};

export function PostHeader({
  title,
  date,
  author,
  language,
  section,
  sectionSlug,
  readingMinutes,
}: Props) {
  return (
    <header className="article-header">
      <Link href="/articulos" className="breadcrumb">← VOLVER AL ARCHIVO</Link>
      <div className="article-header__meta">
        {section && sectionSlug ? <Link href={`/secciones/${sectionSlug}`} className="section-tag">{section}</Link> : null}
        <DateFormatter dateString={date} /><LanguageBadge language={language} />
      </div>
      <PostTitle>{title}</PostTitle>
      <p className="article-header__kicker">IDEAS / CÓDIGO / PROCESO <span>✳</span></p>
      <div className="article-header__byline"><Avatar name={author.name} picture={author.picture} /><span>TIEMPO DE LECTURA / {String(readingMinutes).padStart(2, "0")} MIN</span></div>
      <TechnicalCover title={title} section={section} large />
    </header>
  );
}
