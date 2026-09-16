import { type PostLanguage } from "@/interfaces/post";

export function LanguageBadge({ language }: { language: PostLanguage; compact?: boolean }) {
  return <span className="language-badge" lang={language} aria-label={language === "es" ? "Idioma: español" : "Language: English"}>{language.toUpperCase()}</span>;
}
