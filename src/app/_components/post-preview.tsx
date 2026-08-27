import { type Author } from "@/interfaces/author";
import { type PostLanguage } from "@/interfaces/post";
import cn from "classnames";
import Link from "next/link";
import Avatar from "./avatar";
import CoverImage from "./cover-image";
import DateFormatter from "./date-formatter";
import { LanguageBadge } from "./language-badge";

type Props = {
  title: string;
  coverImage: string;
  date: string;
  excerpt: string;
  author: Author;
  slug: string;
  language: PostLanguage;
  section?: string;
  sectionSlug?: string;
  compact?: boolean;
};

export function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
  language,
  section,
  sectionSlug,
  compact = false,
}: Props) {
  return (
    <div
      lang={language}
      className={cn({
        "mx-auto w-[90%] justify-self-center": compact,
      })}
      style={
        compact
          ? {
              padding: "0.9rem",
              borderRadius: "1.125rem",
            }
          : undefined
      }
    >
      <div className={compact ? "mb-[1.125rem]" : "mb-5"}>
        <CoverImage slug={slug} title={title} src={coverImage} />
      </div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          compact ? "mb-[0.675rem]" : "mb-3",
        )}
      >
        {section && sectionSlug && (
          <Link
            href={`/secciones/${sectionSlug}`}
            className={cn(
              "inline-flex rounded-full border border-violet-300/20 bg-violet-950/50 font-semibold uppercase tracking-wider text-violet-200/80 hover:border-violet-300/40 hover:text-white",
              compact
                ? "px-[0.675rem] py-[0.225rem] text-[0.675rem]"
                : "px-3 py-1 text-xs",
            )}
          >
            {section}
          </Link>
        )}
        <LanguageBadge language={language} compact={compact} />
      </div>
      <h3
        className={cn(
          "leading-snug",
          compact
            ? "mb-[0.675rem] text-[1.6875rem]"
            : "mb-3 text-3xl",
        )}
      >
        <Link href={`/posts/${slug}`} className="hover:underline">
          {title}
        </Link>
      </h3>
      <div
        className={
          compact
            ? "mb-[0.9rem] text-[1.0125rem]"
            : "mb-4 text-lg"
        }
      >
        <DateFormatter dateString={date} />
      </div>
      <p
        className={cn(
          "leading-relaxed",
          compact
            ? "mb-[0.9rem] text-[1.0125rem]"
            : "mb-4 text-lg",
        )}
      >
        {excerpt}
      </p>
      <Avatar
        name={author.name}
        picture={author.picture}
        compact={compact}
      />
    </div>
  );
}
