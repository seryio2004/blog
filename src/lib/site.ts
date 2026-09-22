export const canonicalSiteUrl = "https://continuousdisintegration.com";
export const siteName = "Continuous Disintegration";
export const siteAuthor = "Sergio Rodriguez";
export const siteAuthorX = "@seryioDev";
export const siteAuthorGithub = "https://github.com/seryio2004";
export const siteAuthorXUrl = "https://x.com/seryioDev";
export const defaultSocialImage = "/assets/blog/social-preview.png";
export const defaultSocialImageWidth = 1732;
export const defaultSocialImageHeight = 908;

export function canonicalUrl(path: string): string {
  return new URL(path, canonicalSiteUrl).toString();
}
