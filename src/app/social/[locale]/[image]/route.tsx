import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug, getPostSlugs } from "@/lib/api";
import { locales, type Locale } from "@/lib/i18n";
import { postSocialImageSize } from "@/lib/post-social-image";
import { siteName } from "@/lib/site";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";
export const dynamicParams = false;

const fonts = Promise.all([
  readFile(join(process.cwd(), "src/assets/fonts/LiberationSans-Regular.ttf")),
  readFile(join(process.cwd(), "src/assets/fonts/LiberationSans-Bold.ttf")),
]);

export function generateStaticParams() {
  return locales.flatMap(locale => getAllPosts(locale).map(post => ({
    locale,
    image: `${post.slug}.png`,
  })));
}

function themeFor(section: string) {
  const key = section.toLowerCase();
  if (key === "forgejo") return { paper: "#d3ccbb", accent: "#ffa86a", ink: "#292119" };
  if (["infraestructura", "infrastructure"].includes(key)) return { paper: "#c6d3d8", accent: "#a7e7c7", ink: "#172a32" };
  if (["proyectos", "projects"].includes(key)) return { paper: "#d9c9c5", accent: "#ffb6a2", ink: "#30211f" };
  return { paper: "#bdcbd0", accent: "#d1bdff", ink: "#172329" };
}

function plateFor(slug: string) {
  let hash = 2166136261;
  for (const char of slug) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 900 + 100;
}

export async function GET(_request: Request, { params }: {
  params: Promise<{ locale: string; image: string }>;
}) {
  const { locale, image } = await params;
  const slug = image.endsWith(".png") ? image.slice(0, -4) : "";
  if (!locales.includes(locale as Locale) || !getPostSlugs().includes(`${slug}.md`)) {
    return new Response("Not found", { status: 404 });
  }
  const post = getPostBySlug(slug, locale as Locale);
  const theme = themeFor(post.section);
  const plate = plateFor(slug);
  const shift = plate % 36;
  const titleSize = post.title.length > 85 ? 54 : post.title.length > 55 ? 62 : 76;
  const [regularFont, boldFont] = await fonts;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "40px 52px", background: "#f2f1eb", color: "#11110f", fontFamily: "Liberation Sans", position: "relative" }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 280, display: "flex", background: theme.paper }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 24, borderBottom: "2px solid #11110f", position: "relative" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: -2 }}>C<span style={{ color: "#77216f" }}>/</span>D</div>
          <span style={{ fontSize: 23, fontWeight: 700 }}>{siteName}</span>
        </div>
        <span style={{ fontSize: 18, color: theme.ink }}>CD_{plate} / {locale.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 26, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 804, gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, fontWeight: 700, letterSpacing: 2 }}>
            <span style={{ width: 12, height: 12, background: "#77216f" }} />
            <span>{post.section.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.12, letterSpacing: -2.3 }}>{post.title}</div>
        </div>
        <div style={{ display: "flex", width: 250, height: 300, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="250" height="300" viewBox="0 0 250 300">
            <g fill="none" stroke={theme.ink} strokeWidth="1" opacity="0.18">
              <path d="M25 0v300M75 0v300M125 0v300M175 0v300M225 0v300M0 25h250M0 75h250M0 125h250M0 175h250M0 225h250M0 275h250" />
              <circle cx="125" cy="150" r="110" />
            </g>
            <g fill="none" stroke={theme.ink} strokeWidth="3">
              <path d={`M10 ${68 + shift}H62V112H88M240 ${232 - shift}H188V190H163M125 8V68M125 232V292`} />
              <ellipse cx="125" cy="150" rx="112" ry="62" transform={`rotate(${-32 + shift} 125 150)`} />
            </g>
            <rect x="82" y="108" width="96" height="96" fill={theme.ink} />
            <rect x="72" y="98" width="96" height="96" fill={theme.accent} stroke={theme.ink} strokeWidth="3" transform="rotate(-5 120 146)" />
            <path d="m109 131-17 15 17 15m22-30 17 15-17 15m-8-36-7 42" fill="none" stroke={theme.ink} strokeWidth="5" />
            <circle cx="125" cy="32" r="6" fill={theme.ink} />
            <circle cx="220" cy={232 - shift} r="8" fill={theme.accent} stroke={theme.ink} strokeWidth="3" />
            <path d="M10 25V10h15M225 10h15v15M10 275v15h15M225 290h15v-15" fill="none" stroke={theme.ink} strokeWidth="2" />
          </svg>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 22, borderTop: "2px solid #11110f", fontSize: 20, position: "relative" }}>
        <span>{post.author.name}</span>
        <span style={{ fontSize: 18 }}>continuousdisintegration.com</span>
      </div>
    </div>,
    {
      ...postSocialImageSize,
      fonts: [
        { name: "Liberation Sans", data: regularFont, weight: 400, style: "normal" },
        { name: "Liberation Sans", data: boldFont, weight: 700, style: "normal" },
      ],
      headers: { "Content-Type": "image/png" },
    },
  );
}
