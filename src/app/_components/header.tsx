import Link from "next/link";
import Container from "./container";
import { copy, routes, type Locale } from "@/lib/i18n";

export default function Header({ locale, alternateHref }: { locale: Locale; alternateHref: string }) {
  const text = copy[locale];
  const href = routes(locale);
  return (
    <header className="site-header">
      <Container>
        <div className="site-header__inner">
          <Link href={href.home} className="brand" aria-label={`Continuous Disintegration, ${text.nav.home}`}>
            <span className="brand__mark" aria-hidden="true">C<span>/</span>D</span>
            <span className="brand__name">continuous<br />disintegration<span className="brand__dot">.</span></span>
          </Link>
          <nav className="site-nav" aria-label={text.nav.label}>
            <Link href={href.home}>{text.nav.home}</Link>
            <Link href={href.articles}>{text.nav.articles}</Link>
            <Link href={href.sectionsAnchor}>{text.nav.sections}</Link>
          </nav>
          <div className="site-header__tools">
            <div className="language-switcher" aria-label={locale === "es" ? "Seleccionar idioma" : "Select language"}>
              <span aria-current="true">{locale.toUpperCase()}</span>
              <Link href={alternateHref} hrefLang={locale === "es" ? "en" : "es"}>{locale === "es" ? "EN" : "ES"}</Link>
            </div>
            <div className="site-header__status"><span className="status-led" /> {text.systemActive} <span className="site-header__version">/ V.01</span></div>
          </div>
        </div>
      </Container>
    </header>
  );
}
