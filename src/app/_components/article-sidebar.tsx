"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { routes, type Locale } from "@/lib/i18n";
import { FollowMenu } from "./follow-menu";
import { siteAuthorGithub } from "@/lib/site";

type Recommendation = { slug: string; title: string; section: string };
type WindowId = "articles" | "repositories" | "rss";
type Props = {
  slug: string;
  locale: Locale;
  recommendations: Recommendation[];
  children: ReactNode;
};

const labels = {
  es: {
    recommendations: "Más cosas que he escrito", articles: "seguir-leyendo.txt",
    articlesTitle: "Ya que estás por aquí…", articlesNote: "Quizá también te interese lo que cuento en estos artículos.",
    repositories: "Mis repositorios", git: "repositorios.git", gitTitle: "Del artículo al código.",
    gitNote: "Los proyectos que voy montando, con sus archivos e instrucciones.",
    blog: "El código de este blog", remote: "Mi mando para la tele", allRepos: "Ver mis repositorios",
    rss: "Seguirme por RSS, correo y redes", rssFile: "seguir-en-x.txt", rssTitle: "Seguimos en contacto.",
    rssNote: "Elige cómo seguir mis artículos o contactar conmigo: RSS, correo o X.",
    followX: "Seguirme en X",
    subscribe: "Abrir el feed RSS", own: "DESDE MI TALLER", close: "Cerrar", visit: "Abrir repositorio",
  },
  en: {
    recommendations: "More of my writing", articles: "keep-reading.txt",
    articlesTitle: "While you are here…", articlesNote: "You might also enjoy these articles.",
    repositories: "My repositories", git: "repositories.git", gitTitle: "From writing to code.",
    gitNote: "The projects I build, with their files and instructions.",
    blog: "The code behind this blog", remote: "My TV remote", allRepos: "Browse my repositories",
    rss: "Follow via RSS, email and social media", rssFile: "follow-me.txt", rssTitle: "Stay in touch.",
    rssNote: "Choose how to follow my articles or get in touch: RSS, email or X.",
    followX: "Follow me on X",
    subscribe: "Open the RSS feed", own: "FROM MY WORKSHOP", close: "Close", visit: "Open repository",
  },
} as const;

export function ArticleSidebar({ slug, locale, recommendations, children }: Props) {
  const [closed, setClosed] = useState<WindowId[]>([]);
  const text = labels[locale];
  const storageKey = `article-promos:${slug}`;

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) {
        setClosed(saved.filter((id): id is WindowId => id === "articles" || id === "repositories" || id === "rss"));
      }
    } catch {
      // Closing still works when browser storage is unavailable.
    }
  }, [storageKey]);

  function closeWindow(id: WindowId) {
    const next = [...new Set([...closed, id])];
    setClosed(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Keep the dismissal in component state for this visit.
    }
  }

  function windowCard(id: WindowId, file: string, label: string, body: ReactNode) {
    if (closed.includes(id)) return null;
    return (
      <details
        className={`article-promo article-promo--${id}`}
        aria-label={label}
        open
        onToggle={(event) => {
          if (!event.currentTarget.open) closeWindow(id);
        }}
      >
        <summary className="article-promo__bar" aria-label={`${text.close}: ${label}`}>
          <span><span className="article-promo__dot" aria-hidden="true" />{file}</span>
          <span className="article-promo__close"><span>{text.close}</span><span aria-hidden="true">×</span></span>
        </summary>
        <div className="article-promo__body">{body}</div>
        <div className="article-promo__footer"><span>{text.own}</span><span aria-hidden="true">↗</span></div>
      </details>
    );
  }

  function repositoryCard() {
    return windowCard("repositories", text.git, text.repositories, <>
      <span className="article-promo__symbol" aria-hidden="true">{'</>'}</span>
      <h2>{text.gitTitle}</h2><p>{text.gitNote}</p>
      <div className="article-promo__links">
        <a href={`${siteAuthorGithub}/blog`} target="_blank" rel="noreferrer" aria-label={`${text.visit}: blog`}><strong>blog <span aria-hidden="true">↗</span></strong><small>{text.blog}</small></a>
        <a href={`${siteAuthorGithub}/tv-reomote`} target="_blank" rel="noreferrer" aria-label={`${text.visit}: tv-reomote`}><strong>tv-reomote <span aria-hidden="true">↗</span></strong><small>{text.remote}</small></a>
      </div>
      <a className="article-promo__action" href={`${siteAuthorGithub}?tab=repositories`} target="_blank" rel="noreferrer">{text.allRepos}<span aria-hidden="true">↗</span></a>
    </>);
  }

  function rssCard() {
    return windowCard("rss", text.rssFile, text.rss, <>
      <span className="article-promo__symbol" aria-hidden="true">X</span>
      <h2>{text.rssTitle}</h2><p>{text.rssNote}</p>
      <FollowMenu locale={locale} inline />
    </>);
  }

  return (
    <div className="article-layout article-layout--promos">
      <aside className="article-aside" aria-label={text.recommendations}>
        <div className="article-promo-stack">
          {recommendations.length > 0 && windowCard("articles", text.articles, text.recommendations, <>
            <h2>{text.articlesTitle}</h2><p>{text.articlesNote}</p>
            <div className="article-promo__links">
              {recommendations.map((post) => <Link key={post.slug} href={routes(locale).post(post.slug)}><small>{post.section}</small><strong>{post.title} <span aria-hidden="true">→</span></strong></Link>)}
            </div>
          </>)}
          <div className="article-promo-stack article-promo-stack--compact">{repositoryCard()}{rssCard()}</div>
        </div>
      </aside>
      {children}
      <aside className="article-promo-rail" aria-label={locale === "es" ? "Más de mi taller" : "More from my workshop"}>
        <div className="article-promo-stack">{repositoryCard()}{rssCard()}</div>
      </aside>
    </div>
  );
}
