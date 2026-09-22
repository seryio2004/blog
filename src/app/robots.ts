import type { MetadataRoute } from "next";
import { canonicalSiteUrl, canonicalUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: canonicalUrl("/sitemap.xml"),
    host: canonicalSiteUrl,
  };
}
