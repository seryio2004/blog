"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import type { Locale } from "@/lib/i18n";
import markdownStyles from "./markdown-styles.module.css";

type Props = {
  content: string;
  locale?: Locale;
};

const labels = {
  es: { idle: "Copiar", copied: "Copiado", error: "No se pudo copiar", close: "Cerrar", zoomIn: "Acercar", zoomOut: "Alejar" },
  en: { idle: "Copy", copied: "Copied", error: "Could not copy", close: "Close", zoomIn: "Zoom in", zoomOut: "Zoom out" },
} as const;

export function PostBody({ content, locale = "es" }: Props) {
  const body = useRef<HTMLDivElement>(null);
  const timers = useRef(new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>());
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);
  const [zoom, setZoom] = useState<{ width: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (photo && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [photo]);

  // Keep the point that was clicked under the pointer after zooming in.
  useEffect(() => {
    if (zoom && stage.current) {
      stage.current.scrollTo({ left: zoom.x - stage.current.clientWidth / 2, top: zoom.y - stage.current.clientHeight / 2 });
    }
  }, [zoom]);

  function toggleZoom(event: MouseEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    if (zoom) { setZoom(null); return; }
    const rect = image.getBoundingClientRect();
    const scale = Math.max(2.5, image.naturalWidth / rect.width);
    setZoom({
      width: rect.width * scale,
      x: (event.clientX - rect.left) * scale,
      y: (event.clientY - rect.top) * scale,
    });
  }

  function closePhoto() {
    dialog.current?.close();
  }

  useEffect(() => {
    const pendingTimers = timers.current;
    body.current?.querySelectorAll<HTMLButtonElement>("[data-code-copy]").forEach((button) => {
      button.hidden = false;
    });
    // 3D viewers load three.js only when a model is about to scroll into view.
    const viewers = Array.from(body.current?.querySelectorAll<HTMLElement>("[data-stl-viewer]") ?? []);
    const cleanups: (() => void)[] = [];
    let active = true;
    const observer = viewers.length ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        const figure = entry.target as HTMLElement;
        import("./stl-viewer").then(({ mountStlViewer }) => {
          const cleanup = mountStlViewer(figure);
          if (active) cleanups.push(cleanup); else cleanup();
        }).catch(() => {
          // Never leave the viewer stuck on "loading" if its code cannot be fetched.
          const status = figure.querySelector("[data-stl-status]");
          if (status) status.textContent = figure.dataset.error ?? "Error";
          figure.dataset.state = "error";
        });
      }
    }, { rootMargin: "300px 0px" }) : null;
    viewers.forEach((viewer) => observer?.observe(viewer));
    return () => {
      active = false;
      observer?.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      pendingTimers.forEach(clearTimeout);
      pendingTimers.clear();
    };
  }, [content]);

  async function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLButtonElement>("[data-zoom-src]");
    if (trigger && event.currentTarget.contains(trigger)) {
      setZoom(null);
      setPhoto({ src: trigger.dataset.zoomSrc ?? "", alt: trigger.dataset.zoomAlt ?? "" });
      return;
    }
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
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <dialog
        ref={dialog}
        className={markdownStyles["lightbox"]}
        aria-label={photo?.alt}
        onClose={() => { setPhoto(null); setZoom(null); }}
        onClick={(event) => { if (event.target === event.currentTarget) closePhoto(); }}
      >
        {photo && <>
          <div className={markdownStyles["lightboxBar"]}>
            <span>{photo.alt}</span>
            <button type="button" onClick={() => setZoom(null)} hidden={!zoom}>{labels[locale].zoomOut}</button>
            <button type="button" onClick={closePhoto} autoFocus>{labels[locale].close}</button>
          </div>
          <div ref={stage} className={markdownStyles["lightboxStage"]} data-zoomed={zoom ? "" : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              title={zoom ? labels[locale].zoomOut : labels[locale].zoomIn}
              style={zoom ? { width: zoom.width } : undefined}
              onClick={toggleZoom}
            />
          </div>
        </>}
      </dialog>
    </div>
  );
}
