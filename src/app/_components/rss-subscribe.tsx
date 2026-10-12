"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import type { Locale } from "@/lib/i18n";

export function RssSubscribe({ url, xmlHref, locale }: { url: string; xmlHref: string; locale: Locale }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const text = locale === "es"
    ? { label: "Dirección del feed", copy: "Copiar dirección", copied: "Dirección copiada", error: "No se pudo copiar. Selecciona la dirección y cópiala manualmente.", hint: "Pégala en la opción de añadir una suscripción de tu lector RSS.", xml: "Ver el XML del feed" }
    : { label: "Feed address", copy: "Copy address", copied: "Address copied", error: "Could not copy. Select the address and copy it manually.", hint: "Paste it into your RSS reader's add-subscription option.", xml: "View the XML feed" };

  async function copy() {
    setBusy(true);
    try {
      await copyToClipboard(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return <div className="rss-subscribe">
    <label htmlFor={`rss-url-${locale}`}>{text.label}</label>
    <input id={`rss-url-${locale}`} type="text" value={url} readOnly spellCheck={false} onFocus={(event) => event.currentTarget.select()} />
    <button type="button" className="button button--dark" onClick={copy} disabled={busy}>{status === "copied" ? text.copied : text.copy}<span aria-hidden="true">{status === "copied" ? "✓" : "→"}</span></button>
    <p role="status">{status === "error" ? text.error : text.hint}</p>
    <a className="text-link" href={xmlHref}>{text.xml}<span aria-hidden="true"> ↗</span></a>
  </div>;
}
