import { Post } from "@/interfaces/post";
import { type Author } from "@/interfaces/author";
import { getAuthorProfile } from "@/lib/authors";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import { existsSync } from "fs";
import type { Locale } from "@/lib/i18n";

const postsDirectory = join(process.cwd(), "_posts");

export type PostSection = {
  slug: string;
  name: string;
  posts: Post[];
  latestPost: Post;
};

export type BlogAuthor = Author & {
  slug: string;
  bio: string;
  posts: Post[];
};

export function getSectionSlug(section: string) {
  return section
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory).filter((file) =>
    file.endsWith(".md") &&
    !/\.(?:es|en)\.md$/.test(file) &&
    fs.readFileSync(join(postsDirectory, file), "utf8").startsWith("---\n"),
  );
}

export function getPostBySlug(slug: string, locale: Locale = "es") {
  const realSlug = slug.replace(/\.md$/, "");
  const originalPath = join(postsDirectory, `${realSlug}.md`);
  const localizedPath = join(postsDirectory, `${realSlug}.${locale}.md`);
  const originalMatter = matter(fs.readFileSync(originalPath, "utf8"));
  const fullPath = originalMatter.data.language === locale || !existsSync(localizedPath)
    ? originalPath
    : localizedPath;
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  if (typeof data.section !== "string" || !data.section.trim()) {
    throw new Error(
      `El artículo "${realSlug}" debe incluir el metadato "section".`,
    );
  }

  if (data.language !== "es" && data.language !== "en") {
    throw new Error(
      `El artículo "${realSlug}" debe incluir "language: es" o "language: en".`,
    );
  }

  return {
    ...data,
    section: data.section.trim(),
    language: data.language,
    slug: realSlug,
    content,
  } as Post;
}

export function getAllPosts(locale: Locale = "es"): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, locale))
    // sort posts by date in descending order
    .sort(
      (post1, post2) =>
        Date.parse(post2.date) - Date.parse(post1.date) ||
        post1.slug.localeCompare(post2.slug),
    );
  return posts;
}

export function getSections(locale: Locale = "es"): PostSection[] {
  const sections = new Map<string, { name: string; posts: Post[] }>();

  for (const post of getAllPosts(locale)) {
    const slug = getSectionSlug(post.section);

    if (!slug) {
      throw new Error(
        `La sección del artículo "${post.slug}" no genera una URL válida.`,
      );
    }

    const existingSection = sections.get(slug);

    if (existingSection) {
      existingSection.posts.push(post);
    } else {
      sections.set(slug, { name: post.section, posts: [post] });
    }
  }

  return Array.from(sections, ([slug, section]) => ({
    slug,
    name: section.name,
    posts: section.posts,
    latestPost: section.posts[0],
  }));
}

export function getSectionBySlug(slug: string, locale: Locale = "es") {
  return getSections(locale).find((section) => section.slug === getSectionSlug(slug));
}

export function getAlternateSectionSlug(slug: string, locale: Locale) {
  const section = getSectionBySlug(slug, locale);
  if (!section) return slug;
  const otherLocale: Locale = locale === "es" ? "en" : "es";
  return getSectionSlug(getPostBySlug(section.posts[0].slug, otherLocale).section);
}

export function getAuthors(locale: Locale = "es"): BlogAuthor[] {
  const authors = new Map<string, BlogAuthor>();

  for (const post of getAllPosts(locale)) {
    const profile = getAuthorProfile(post.author.name, locale);
    const existingAuthor = authors.get(profile.slug);

    if (existingAuthor) {
      existingAuthor.posts.push(post);
    } else {
      authors.set(profile.slug, {
        ...post.author,
        ...profile,
        posts: [post],
      });
    }
  }

  return Array.from(authors.values());
}

export function getAuthorBySlug(slug: string, locale: Locale = "es") {
  const normalizedSlug = slug.trim().toLowerCase();

  return getAuthors(locale).find((author) => author.slug === normalizedSlug);
}
