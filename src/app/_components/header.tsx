import Link from "next/link";
import Container from "./container";

export default function Header() {
  return (
    <header className="site-header">
      <Container>
        <div className="site-header__inner">
          <Link href="/" className="brand" aria-label="Continuous Disintegration, inicio">
            <span className="brand__mark" aria-hidden="true">C<span>/</span>D</span>
            <span className="brand__name">continuous<br />disintegration<span className="brand__dot">.</span></span>
          </Link>
          <nav className="site-nav" aria-label="Navegación principal">
            <Link href="/">Inicio</Link>
            <Link href="/articulos">Artículos <span aria-hidden="true">↗</span></Link>
            <Link href="/#secciones">Secciones</Link>
          </nav>
          <div className="site-header__status"><span className="status-led" /> SISTEMA ACTIVO <span className="site-header__version">/ V.01</span></div>
        </div>
      </Container>
    </header>
  );
}
