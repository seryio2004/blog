import Link from "next/link";

type Props = { title: string; section?: string; slug?: string; large?: boolean };

export function TechnicalCover({ title, section = "Editorial", slug, large = false }: Props) {
  const visual = (
    <div className={`technical-cover ${large ? "technical-cover--large" : ""}`} data-section={section.toLowerCase()} aria-hidden="true">
      <div className="technical-cover__top"><span>CD / VISUAL SYSTEM</span><span>FIG. 001 -&gt;</span></div>
      <div className="technical-cover__diagram">
        <span className="technical-cover__orbit technical-cover__orbit--one" />
        <span className="technical-cover__orbit technical-cover__orbit--two" />
        <span className="technical-cover__core">{section.slice(0, 2).toUpperCase()}</span>
        <span className="technical-cover__cross technical-cover__cross--one">+</span>
        <span className="technical-cover__cross technical-cover__cross--two">+</span>
      </div>
      <div className="technical-cover__bottom"><span>{section.toUpperCase()} / {title.slice(0, 22).toUpperCase()}</span><span>◎ 01</span></div>
    </div>
  );
  return slug ? <Link href={`/posts/${slug}`} className="technical-cover__link" aria-label={`Leer ${title}`}>{visual}</Link> : visual;
}
