export default function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-bg"></div>
      <div className="hero-grid"></div>
      <div className="hero-orb"></div>
      <div className="hero-orb-2"></div>
      <div className="hero-line"></div>

      <div className="hero-content">
        <div className="hero-eyebrow">Perfumería de Lujo — Inspiradas en Íconos</div>
        <h1 className="hero-title">
          La esencia<br />del lujo, <em>a tu<br />alcance</em>
        </h1>
        <p className="hero-sub">
          Fragancias inspiradas en los perfumes más icónicos del mundo. Carácter, fijación y elegancia. Tuyas.
        </p>
        <div className="hero-ctas">
          <a href="#catalogo" className="btn-primary">
            Explorar Catálogo
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
          <a href="#calidades" className="btn-ghost">Ver Calidades</a>
        </div>
      </div>

      <div className="hero-badge">
        <div className="hero-badge-inner">
          <span className="hero-badge-num">98%</span>
          <span className="hero-badge-label">Similitud<br />Garantizada</span>
        </div>
      </div>

      <div className="hero-scroll-hint">Scroll</div>
    </section>
  );
}
