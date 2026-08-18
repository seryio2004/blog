"use client";

import { useEffect, useRef } from "react";

export function PostLiquidBackground() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;

    if (!layer) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let animationFrame = 0;

    const updateParallax = () => {
      animationFrame = 0;

      if (reducedMotion.matches) {
        layer.style.transform = "none";
        return;
      }

      const availableScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(
        Math.max(window.scrollY / availableScroll, 0),
        1,
      );
      const verticalOffset = progress * window.innerHeight * 0.35;
      const scale = 1 + progress * 0.13;

      layer.style.transform =
        `translate3d(0, -${verticalOffset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    };

    const scheduleUpdate = () => {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      resizeObserver.disconnect();

      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div ref={layerRef} className="post-liquid-scroll" aria-hidden="true">
      <div className="post-liquid-blob post-liquid-blob--blue" />
      <div className="post-liquid-blob post-liquid-blob--shadow" />
    </div>
  );
}
