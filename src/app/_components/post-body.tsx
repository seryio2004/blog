"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import type { Locale } from "@/lib/i18n";
import markdownStyles from "./markdown-styles.module.css";

type Props = {
  content: string;
  locale?: Locale;
};

const labels = {
  es: { idle: "Copiar", copied: "Copiado", error: "No se pudo copiar" },
  en: { idle: "Copy", copied: "Copied", error: "Could not copy" },
} as const;

export function PostBody({ content, locale = "es" }: Props) {
  const body = useRef<HTMLDivElement>(null);
  const timers = useRef(new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pendingTimers = timers.current;
    body.current?.querySelectorAll<HTMLButtonElement>("[data-code-copy]").forEach((button) => {
      button.hidden = false;
    });
    return () => {
      pendingTimers.forEach(clearTimeout);
      pendingTimers.clear();
    };
  }, [content]);

  async function handleCopy(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("[data-code-copy]");
    if (!button || !event.currentTarget.contains(button) || button.disabled) return;
    const code = button.closest("[data-code-block]")?.querySelector("pre code");
    const label = button.querySelector("[data-copy-label]");
    if (!code || !label) return;
    const previousTimer = timers.current.get(button);
    if (previousTimer) clearTimeout(previousTimer);
    button.disabled = true;
    try {
      await copyToClipboard(code.textContent ?? "");
      label.textContent = labels[locale].copied;
      button.dataset.state = "copied";
    } catch {
      label.textContent = labels[locale].error;
      button.dataset.state = "error";
    } finally {
      button.disabled = false;
    }
    if (!button.isConnected) return;
    timers.current.set(button, setTimeout(() => {
      label.textContent = labels[locale].idle;
      delete button.dataset.state;
      timers.current.delete(button);
    }, 2600));
  }

  return (
    <div className="w-full">
      <div
        ref={body}
        className={markdownStyles["markdown"]}
        onClick={handleCopy}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
