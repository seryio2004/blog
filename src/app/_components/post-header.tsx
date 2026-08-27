import Avatar from "./avatar";
import CoverImage from "./cover-image";
import DateFormatter from "./date-formatter";
import { LanguageBadge } from "./language-badge";
import { PostTitle } from "@/app/_components/post-title";
import { type Author } from "@/interfaces/author";
import { type PostLanguage } from "@/interfaces/post";

type Props = {
  title: string;
  coverImage: string;
  date: string;
  author: Author;
  language: PostLanguage;
};

export function PostHeader({
  title,
  coverImage,
  date,
  author,
  language,
}: Props) {
  return (
    <>
      <PostTitle>{title}</PostTitle>
      <div className="hidden md:block md:mb-12">
        <Avatar name={author.name} picture={author.picture} />
      </div>

      <div className="mb-8 w-full md:mb-16">
        <CoverImage title={title} src={coverImage} />
      </div>
      <div className="w-full">
        <div className="block md:hidden mb-6">
          <Avatar name={author.name} picture={author.picture} />
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-3 text-lg">
          <DateFormatter dateString={date} />
          <LanguageBadge language={language} />
        </div>
      </div>
    </>
  );
}
