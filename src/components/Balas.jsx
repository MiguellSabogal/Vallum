'use client';
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { fmt } from '../utils/format.js';
import { BALAS_LIST } from '../lib/balas.js';

function BalaCard({ bala }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ id: bala.id, name: bala.name, house: 'Vallum' }, bala.size, bala.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="bala-card">
      <div className="bala-visual" aria-hidden="true">
        <svg viewBox="0 0 40 120" className="bala-svg">
          <rect x="14" y="4" width="12" height="14" rx="2" fill="currentColor" opacity="0.9" />
          <rect x="16" y="18" width="8" height="6" fill="currentColor" opacity="0.5" />
          <rect x="11" y="24" width="18" height="92" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <rect x="13" y="40" width="14" height="74" rx="3" fill="currentColor" opacity="0.18" />
        </svg>
      </div>
      <div className="bala-size">{bala.size}</div>
      <div className="bala-name">{bala.name}</div>
      <p className="bala-desc">
        Tu fragancia favorita en formato de bolsillo, bien recargada: máxima
        concentración de esencia para que dure todo el día. Indícanos el perfume
        que quieres en las notas del pedido.
      </p>
      <div className="bala-footer">
        <span className="bala-price">{fmt(bala.price)}</span>
        <button
          className="add-cart-btn bala-add"
          onClick={handleAdd}
        >{added ? '✓ Añadido' : '+ Añadir'}</button>
      </div>
    </div>
  );
}

export default function Balas() {
  return (
    <div className="balas-block">
      <h3 className="balas-title">Balas <em className="text-gold">Recargadas</em></h3>
      <p className="balas-intro">
        Llévate cualquier fragancia del catálogo en bala atomizadora: discreta,
        perfecta para el bolso o el bolsillo, y cargada con una gran cantidad de esencia.
      </p>
      <div className="balas-grid">
        {BALAS_LIST.map((b) => <BalaCard key={b.id} bala={b} />)}
      </div>
    </div>
  );
}
