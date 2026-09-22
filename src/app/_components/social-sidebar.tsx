const links = [
  ["GH", "GitHub", "https://github.com/seryio2004/blog"],
  ["X", "X", "https://x.com/seryioDev"],
  ["@", "Correo", "mailto:rodriguezsergiomartinez@gmail.com"],
] as const;

export default function SocialSidebar({ locale = "es" }: { locale?: "es" | "en" }) {
  return (
    <nav className="social-links" aria-label={locale === "es" ? "Enlaces sociales" : "Social links"}>
      {links.map(([icon, label, href]) => <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}><span aria-hidden="true">{icon}</span>{locale === "en" && label === "Correo" ? "Email" : label}<b aria-hidden="true">-&gt;</b></a>)}
    </nav>
  );
}
