import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Props = { title: string; section?: string; slug?: string; large?: boolean };
type Motif = "orbit" | "branch" | "signal" | "circuit" | "stack" | "constellation";
type Palette = { paper: string; ink: string; accent: string };
type CoverStyle = CSSProperties & {
  "--cover-paper": string;
  "--cover-ink": string;
  "--cover-accent": string;
};

const motifs: Motif[] = ["orbit", "branch", "signal", "circuit", "stack", "constellation"];
const palettes: Palette[] = [
  { paper: "#c8d1d0", ink: "#182422", accent: "#a9e9dd" },
  { paper: "#d9d1c1", ink: "#282018", accent: "#f6aa72" },
  { paper: "#c9c9d6", ink: "#222037", accent: "#d1bdff" },
  { paper: "#d3d4bc", ink: "#262919", accent: "#c7ff22" },
  { paper: "#c6d0dc", ink: "#1b2732", accent: "#a8d9ff" },
  { paper: "#d9c9c5", ink: "#30211f", accent: "#ffb6a2" },
];

const namedSections: Record<string, { motif: Motif; palette: Palette }> = {
  python: { motif: "orbit", palette: { paper: "#bdcbd0", ink: "#172329", accent: "#c7ff22" } },
  forgejo: { motif: "branch", palette: { paper: "#d3ccbb", ink: "#292119", accent: "#ffa86a" } },
};

function sectionKey(section: string) {
  return section.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hashSection(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sectionMonogram(section: string) {
  const words = section.trim().split(/\s+/);
  return (words.length > 1 ? words.slice(0, 2).map(word => word[0]).join("") : words[0].slice(0, 2)).toUpperCase();
}

function Diagram({ motif, seed }: { motif: Motif; seed: number }) {
  const offset = seed % 49 - 24;
  const turn = (seed >>> 7) % 38 - 19;
  let drawing: ReactNode;

  switch (motif) {
    case "orbit":
      drawing = <g transform={`rotate(${turn} 280 170)`}>
        <ellipse className="technical-cover__trace" cx="280" cy="170" rx={162 + offset} ry="87" />
        <ellipse className="technical-cover__trace" cx="280" cy="170" rx="112" ry={148 + offset / 2} transform="rotate(55 280 170)" />
        <circle className="technical-cover__accent" cx={420 + offset} cy="114" r="12" />
        <circle className="technical-cover__node" cx="170" cy="218" r="5" />
      </g>;
      break;
    case "branch": {
      const middle = 280 + offset;
      drawing = <g>
        <path className="technical-cover__trace" d={`M140 60 V280 H${middle} V74 M${middle} 170 H410 V108 M${middle} 242 H450 V294`} />
        <path className="technical-cover__trace technical-cover__trace--thin" d={`M140 105 H${middle} M410 108 H485 M450 294 H490`} />
        {[[140, 60], [140, 105], [middle, 170], [middle, 242], [410, 108], [450, 294]].map(([x, y], index) =>
          <circle key={index} className={index === 2 || index === 5 ? "technical-cover__accent" : "technical-cover__node"} cx={x} cy={y} r={index === 2 ? 12 : 8} />)}
      </g>;
      break;
    }
    case "signal": {
      const phase = (seed % 17) / 5;
      const waveY = (index: number) => 170 + Math.sin(index * .7 + phase) * (43 + offset / 3) + Math.sin(index * 1.9) * 13;
      const points = Array.from({ length: 29 }, (_, index) => `${28 + index * 18},${waveY(index).toFixed(1)}`).join(" ");
      drawing = <g>
        <path className="technical-cover__trace technical-cover__trace--thin" d="M28 111 H532 M28 230 H532" />
        <polyline className="technical-cover__trace technical-cover__trace--bold" points={points} />
        {[85, 190, 365, 470].map((x, index) => <path key={x} className="technical-cover__trace technical-cover__trace--thin" d={`M${x} ${index % 2 ? 90 : 225} V${index % 2 ? 250 : 105}`} />)}
        <circle className="technical-cover__accent" cx="352" cy={waveY(18)} r="9" />
      </g>;
      break;
    }
    case "circuit":
      drawing = <g>
        <path className="technical-cover__trace" d={`M55 79 H${190 + offset} V160 H315 V75 H505 M55 260 H205 V210 H${385 + offset} V270 H505`} />
        <path className="technical-cover__trace technical-cover__trace--thin" d="M82 131 H160 V195 H260 M470 130 H390 V195 H330" />
        {[[55, 79], [505, 75], [55, 260], [505, 270], [260, 195], [330, 195]].map(([x, y], index) =>
          <circle key={index} className={index === 4 ? "technical-cover__accent" : "technical-cover__node"} cx={x} cy={y} r={index === 4 ? 10 : 6} />)}
      </g>;
      break;
    case "stack":
      drawing = <g transform={`rotate(${turn / 2} 280 170)`}>
        {[0, 1, 2].map(index => <rect key={index} className={index === 2 ? "technical-cover__accent technical-cover__accent--outline" : "technical-cover__trace"} x={130 + index * 36 + offset / 2} y={54 + index * 35} width="245" height="170" />)}
        <path className="technical-cover__trace technical-cover__trace--thin" d="M175 85 H320 M210 120 H330 M245 155 H370" />
      </g>;
      break;
    case "constellation": {
      const points = Array.from({ length: 7 }, (_, index) => ({
        x: 70 + ((seed >>> ((index % 4) * 6)) + index * 97) % 420,
        y: 50 + ((seed >>> (((index + 2) % 4) * 6)) + index * 53) % 240,
      }));
      drawing = <g>
        <polyline className="technical-cover__trace" points={points.map(point => `${point.x},${point.y}`).join(" ")} />
        {points.map((point, index) => <circle key={index} className={index === 3 ? "technical-cover__accent" : "technical-cover__node"} cx={point.x} cy={point.y} r={index === 3 ? 12 : 6} />)}
      </g>;
      break;
    }
  }

  return <svg viewBox="0 0 560 340" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path className="technical-cover__axis" d="M280 16 V324 M16 170 H544" />
    <circle className="technical-cover__axis" cx="280" cy="170" r="152" />
    {drawing}
    <path className="technical-cover__registration" d="M25 35 h25 M25 35 v25 M535 35 h-25 M535 35 v25 M25 305 h25 M25 305 v-25 M535 305 h-25 M535 305 v-25" />
  </svg>;
}

export function TechnicalCover({ title, section = "Editorial", slug, large = false }: Props) {
  const key = sectionKey(section);
  const seed = hashSection(key);
  const identity = namedSections[key] ?? {
    motif: motifs[(seed >>> 4) % motifs.length],
    palette: palettes[seed % palettes.length],
  };
  const style: CoverStyle = {
    "--cover-paper": identity.palette.paper,
    "--cover-ink": identity.palette.ink,
    "--cover-accent": identity.palette.accent,
  };
  const plate = String(seed % 900 + 100);

  const visual = <div className={`technical-cover ${large ? "technical-cover--large" : ""}`} style={style} aria-hidden="true">
    <div className="technical-cover__top"><span>CD / SECTION ATLAS</span><span>PLATE {plate}</span></div>
    <div className="technical-cover__diagram">
      <Diagram motif={identity.motif} seed={seed} />
      <span className="technical-cover__core">{sectionMonogram(section)}</span>
      <span className="technical-cover__diagram-label">{identity.motif.toUpperCase()} / {key.toUpperCase()}</span>
    </div>
    <div className="technical-cover__bottom"><span>{section.toUpperCase()} / {title.toUpperCase()}</span><span>CD_{plate}</span></div>
  </div>;

  return slug ? <Link href={`/posts/${slug}`} className="technical-cover__link" aria-label={`Leer ${title}`}>{visual}</Link> : visual;
}
