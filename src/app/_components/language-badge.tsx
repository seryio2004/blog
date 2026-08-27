import cn from "classnames";
import { type PostLanguage } from "@/interfaces/post";

const LANGUAGE_LABELS: Record<PostLanguage, string> = {
  en: "English",
  es: "Español",
};

type Props = {
  language: PostLanguage;
  compact?: boolean;
};

export function LanguageBadge({ language, compact = false }: Props) {
  const label = LANGUAGE_LABELS[language];
  const accessibleLabel =
    language === "es" ? "Idioma: Español" : "Language: English";

  return (
    <span
      lang={language}
      aria-label={accessibleLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider",
        language === "es"
          ? "border-amber-300/25 bg-amber-950/45 text-amber-100/85"
          : "border-cyan-300/25 bg-cyan-950/45 text-cyan-100/85",
        compact
          ? "px-[0.675rem] py-[0.225rem] text-[0.675rem]"
          : "px-3 py-1 text-xs",
      )}
    >
      <span aria-hidden="true">{language.toUpperCase()}</span>
      <span aria-hidden="true">·</span>
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
