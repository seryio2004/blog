export const canonicalSiteUrl = "https://continuousdisintegration.com";

export function canonicalUrl(path: string): string {
  return new URL(path, canonicalSiteUrl).toString();
}
