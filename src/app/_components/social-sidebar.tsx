type SocialIconName = "github" | "x" | "mail";

type SocialLink = {
  label: string;
  href: string;
  icon: SocialIconName;
  external?: boolean;
};

const socialLinks: SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/seryio2004/blog",
    icon: "github",
    external: true,
  },
  {
    label: "X",
    href: "https://x.com/seryio2004",
    icon: "x",
    external: true,
  },
  {
    label: "Correo",
    href: "mailto:rodriguezsergiomartinez@gmail.com",
    icon: "mail",
  },
];

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "github") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5 fill-current"
      >
        <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.99c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M5 4 19 20M19 4 5 20"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.1"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function SocialSidebar() {
  return (
    <aside
      className="fixed right-2 top-1/2 z-20 -translate-y-1/2 rounded-2xl border border-sky-300/15 bg-slate-950/70 p-2 shadow-[0_1.5rem_4rem_rgba(2,6,23,0.38)] backdrop-blur-xl sm:right-4 sm:p-3"
      aria-labelledby="social-links-title"
    >
      <div className="flex flex-col items-center gap-2">
        <h2
          id="social-links-title"
          className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-sky-200/60 sm:text-[0.65rem] sm:tracking-[0.2em]"
        >
          Conecta
        </h2>
        <span
          aria-hidden="true"
          className="block h-px w-8 bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
        />

        <nav aria-label="Enlaces del blog">
          <ul className="flex flex-col gap-2">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:h-11 sm:w-11"
                >
                  <SocialIcon name={link.icon} />
                  <span className="sr-only">{link.label}</span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-full z-30 mr-3 block whitespace-nowrap rounded-lg border border-sky-300/15 bg-slate-950/95 px-3 py-2 text-xs font-medium text-sky-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {link.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
