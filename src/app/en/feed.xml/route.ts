import { getAllPosts } from "@/lib/api";
import { canonicalSiteUrl } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function GET() {
  const items = getAllPosts("en").map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${canonicalSiteUrl}/en/posts/${encodeURIComponent(post.slug)}/</link>
      <guid>${canonicalSiteUrl}/en/posts/${encodeURIComponent(post.slug)}/</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.section)}</category>
    </item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
  <title>Continuous Disintegration</title>
  <link>${canonicalSiteUrl}/en/</link>
  <description>Ideas about programming, electronics and digital design.</description>${items}
  <language>en</language>
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
