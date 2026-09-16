import Link from "next/link";
import Container from "./container";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__top">
          <div>
            <p className="eyebrow">// FIN DEL ARCHIVO</p>
            <p className="site-footer__statement">Seguimos<br />cacharreando<span>.</span></p>
          </div>
          <Link href="/articulos" className="button button--light">Explorar artículos <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} CONTINUOUS DISINTEGRATION</span>
          <span>IDEAS, CÓDIGO Y OTRAS COSAS.</span>
          <a href="#top">VOLVER ARRIBA ↑</a>
        </div>
      </Container>
    </footer>
  );
}
