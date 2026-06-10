import Link from 'next/link';

// Paginación SSR: enlaces ?page=N (rastreables por buscadores).
export default function Pagination({ page, totalPages, basePath }) {
  if (totalPages <= 1) return null;

  const href = (n) => (n === 1 ? `${basePath}#catalogo` : `${basePath}?page=${n}#catalogo`);

  // Ventana de páginas: 1 … (p-1, p, p+1) … total
  const items = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) {
      items.push(n);
    } else if (items[items.length - 1] !== '…') {
      items.push('…');
    }
  }

  return (
    <nav className="pagination" aria-label="Paginación del catálogo">
      <Link
        className={`page-link page-arrow${page <= 1 ? ' is-disabled' : ''}`}
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
       
      >
        ←
      </Link>

      {items.map((it, i) =>
        it === '…' ? (
          <span key={`gap-${i}`} className="page-gap">…</span>
        ) : (
          <Link
            key={it}
            className={`page-link${it === page ? ' is-active' : ''}`}
            href={href(it)}
            aria-current={it === page ? 'page' : undefined}
           
          >
            {it}
          </Link>
        )
      )}

      <Link
        className={`page-link page-arrow${page >= totalPages ? ' is-disabled' : ''}`}
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
       
      >
        →
      </Link>
    </nav>
  );
}
