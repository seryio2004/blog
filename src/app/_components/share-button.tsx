"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

type ShareState = "idle" | "shared" | "copied" | "error";

const labels = {
  es: {
    idle: "Compartir",
    shared: "Compartido",
    copied: "Enlace copiado",
    error: "No se pudo copiar",
    aria: "Compartir este artículo",
  },
  en: {
    idle: "Share",
    shared: "Shared",
    copied: "Link copied",
    error: "Could not copy",
    aria: "Share this article",
  },
} as const;

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(input);

  if (!copied) throw new Error("Copy command failed");
}

export function ShareButton({
  title,
  url,
  locale,
}: {
  title: string;
  url: string;
  locale: Locale;
}) {
  const [state, setState] = useState<ShareState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const text = labels[locale];

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  function showResult(result: ShareState) {
    setState(result);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 2600);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        showResult("shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await copyToClipboard(url);
      showResult("copied");
    } catch {
      showResult("error");
    }
  }

  return (
    <button
      type="button"
      className="article-share-button"
      data-state={state}
      onClick={handleShare}
      aria-label={text.aria}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
        <circle cx="5" cy="10" r="2.25" />
        <circle cx="15" cy="5" r="2.25" />
        <circle cx="15" cy="15" r="2.25" />
        <path d="m7 9 5.8-3M7 11l5.8 3" />
      </svg>
      <span aria-live="polite">{text[state]}</span>
    </button>
  );
}
