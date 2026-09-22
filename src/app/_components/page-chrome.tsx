import type { Locale } from "@/lib/i18n";
import Footer from "./footer";
import Header from "./header";

export function PageChrome({ locale, alternateHref, children }: { locale: Locale; alternateHref: string; children: React.ReactNode }) {
  return <><Header locale={locale} alternateHref={alternateHref} />{children}<Footer locale={locale} /></>;
}
