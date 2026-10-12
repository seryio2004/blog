"use client";

import { useEffect, useRef } from "react";
import { routes, type Locale } from "@/lib/i18n";
import { withBasePath } from "@/lib/paths";
import { siteAuthorEmail, siteAuthorX, siteAuthorXUrl } from "@/lib/site";

// Add profile URLs here when these channels are ready.
const upcomingChannels = [
  { name: "Instagram", icon: "IG", href: null as string | null },
  { name: "TikTok", icon: "TK", href: null as string | null },
];

export function FollowMenu({ locale, inline = false }: { locale: Locale; inline?: boolean }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const text = locale === "es"
    ? { follow: "Sígueme", label: "Dónde seguirme y contactar", title: "Nos vemos por aquí", rss: "Artículos en tu lector de feeds", email: "Correo", emailNote: "Escríbeme directamente", soon: "Próximamente" }
    : { follow: "Follow me", label: "Where to follow and contact me", title: "Find me here", rss: "Articles in your feed reader", email: "Email", emailNote: "Write to me directly", soon: "Coming soon" };
  const links = [
    { name: "RSS", icon: "RSS", note: text.rss, href: withBasePath(routes(locale).rss) },
    { name: text.email, icon: "@", note: text.emailNote, href: `mailto:${siteAuthorEmail}` },
    { name: "X", icon: "X", note: siteAuthorX, href: siteAuthorXUrl },
  ];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && menu.current && !menu.current.contains(event.target)) menu.current.open = false;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={menu} className={`follow-menu${inline ? " follow-menu--inline" : ""}`}>
      <summary>{text.follow}<span aria-hidden="true">＋</span></summary>
      <nav className="follow-menu__panel" aria-label={text.label}>
        <p className="follow-menu__title">{text.title}</p>
        <ul>
          {links.map((link) => <li key={link.name}><a href={link.href} target={link.href.startsWith("https://") ? "_blank" : undefined} rel={link.href.startsWith("https://") ? "noreferrer" : undefined}>
            <span className="follow-menu__icon" aria-hidden="true">{link.icon}</span><span><strong>{link.name}</strong><small>{link.note}</small></span><span aria-hidden="true">↗</span>
          </a></li>)}
          {upcomingChannels.map((channel) => <li key={channel.name}>{channel.href ? <a href={channel.href} target="_blank" rel="noreferrer"><span className="follow-menu__icon" aria-hidden="true">{channel.icon}</span><span><strong>{channel.name}</strong></span><span aria-hidden="true">↗</span></a> : <div className="follow-menu__upcoming" aria-disabled="true"><span className="follow-menu__icon" aria-hidden="true">{channel.icon}</span><span><strong>{channel.name}</strong><small>{text.soon}</small></span><span aria-hidden="true">…</span></div>}</li>)}
        </ul>
      </nav>
    </details>
  );
}
