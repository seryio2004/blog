import { type Author } from "./author";

export type PostLanguage = "en" | "es";

export type Post = {
  slug: string;
  section: string;
  language: PostLanguage;
  title: string;
  date: string;
  coverImage: string;
  author: Author;
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
  preview?: boolean;
};
