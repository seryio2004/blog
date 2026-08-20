import { Post } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

export type PostSection = {
  slug: string;
  name: string;
  posts: Post[];
  latestPost: Post;
};

function getSectionSlug(section: string) {
  return section
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  if (typeof data.section !== "string" || !data.section.trim()) {
    throw new Error(
      `El artículo "${realSlug}" debe incluir el metadato "section".`,
    );
  }

  return {
    ...data,
    section: data.section.trim(),
    slug: realSlug,
    content,
  } as Post;
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // sort posts by date in descending order
    .sort(
      (post1, post2) =>
        Date.parse(post2.date) - Date.parse(post1.date) ||
        post1.slug.localeCompare(post2.slug),
    );
  return posts;
}

export function getSections(): PostSection[] {
  const sections = new Map<string, { name: string; posts: Post[] }>();

  for (const post of getAllPosts()) {
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

export function getSectionBySlug(slug: string) {
  return getSections().find((section) => section.slug === getSectionSlug(slug));
}
