import Link from "next/link";
import Container from "./container";
import { copy, routes, type Locale } from "@/lib/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const text = copy[locale];
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__top">
          <div>
            <p className="eyebrow">{text.footerEnd}</p>
            <p className="site-footer__statement">{text.footerStatement[0]}<br />{text.footerStatement[1]}<span>.</span></p>
          </div>
          <Link href={routes(locale).articles} className="button button--light">{text.exploreArticles} <span aria-hidden="true">-&gt;</span></Link>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} CONTINUOUS DISINTEGRATION</span>
          <span>{text.footerTagline}</span>
          <a href="#top">{text.backTop}</a>
        </div>
      </Container>
    </footer>
  );
}
