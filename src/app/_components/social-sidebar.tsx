const links = [
  ["GH", "GitHub", "https://github.com/seryio2004/blog"],
  ["X", "X", "https://x.com/seryio2004"],
  ["@", "Correo", "mailto:rodriguezsergiomartinez@gmail.com"],
] as const;

export default function SocialSidebar() {
  return (
    <nav className="social-links" aria-label="Enlaces sociales">
      {links.map(([icon, label, href]) => <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}><span aria-hidden="true">{icon}</span>{label}<b aria-hidden="true">↗</b></a>)}
    </nav>
  );
}
