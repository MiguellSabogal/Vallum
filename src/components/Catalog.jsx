import ProductCard from './ProductCard.jsx';

export default function Catalog({
  products,
  loading,
  error,
  eyebrow = 'Catálogo Destacado',
  title = <>Fragancias <em>Icónicas</em></>,
  subtitle,
  topPad = false,
}) {
  const empty = !loading && !error && products.length === 0;

  return (
    <section className={`catalog${topPad ? ' catalog-page' : ''}`} id="catalogo">
      <div className="section-inner">
        <div className="section-eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="catalog-subtitle">{subtitle}</p>}

        <div className="products-grid" id="products-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {loading && <p className="catalog-state">Cargando catálogo…</p>}
        {error && <p className="catalog-state catalog-error">No se pudo cargar el catálogo: {error}</p>}
        {empty && <p className="catalog-state">No hay productos en esta categoría todavía.</p>}
      </div>
    </section>
  );
}
