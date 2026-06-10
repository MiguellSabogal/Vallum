'use client';
import { useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { fmt } from '../utils/format.js';
import BottleSvg from './BottleSvg.jsx';
import { BALAS } from '../lib/balas.js';

// Presentaciones: frasco en dos calidades, o bala recargada (precio fijo).
const PRESENTACIONES = [
  { key: 'AA', label: 'AA' },
  { key: 'AAA', label: 'AAA' },
  { key: 'bala-50', label: 'Bala 50ml' },
  { key: 'bala-100', label: 'Bala 100ml' },
];

export default function ProductCard({ product: p }) {
  const { addItem } = useCart();
  const [pres, setPres] = useState('AAA');
  const [added, setAdded] = useState(false);
  const priceRef = useRef(null);
  const addTimer = useRef(null);

  const bala = BALAS[pres];
  const price = bala ? bala.price : pres === 'AAA' ? p.priceAAA : p.priceAA;

  function selectPres(k) {
    if (k === pres) return;
    setPres(k);
    // Pulso de escala en el precio, igual que la version vanilla
    const el = priceRef.current;
    if (el) {
      el.style.transform = 'scale(1.1)';
      el.style.transition = 'transform 0.15s';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 180);
    }
  }

  function handleAdd(e) {
    e.stopPropagation();
    if (bala) {
      // Línea de bala ligada a esta fragancia: el id compuesto lo resuelve el servidor.
      addItem({ ...p, id: `${bala.id}:${p.id}` }, bala.size, bala.price);
    } else {
      addItem(p, pres, price);
    }
    setAdded(true);
    clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setAdded(false), 1400);
  }

  // Estrellas: igual que el original, hasta 5 segun la longitud del nombre
  const starCount = [...p.name].slice(0, 5).length;

  return (
    <div className="product-card" data-id={p.id}>
      {p.isNew ? <span className="new-badge">Nuevo</span> : null}
      {p.imageUrl ? (
        <img src={p.imageUrl} alt={p.name} className="product-visual" loading="lazy" decoding="async" />
      ) : (
        <div className="product-visual-placeholder" style={{ background: p.colorBg }}>
          <span className="perfume-name-bg" style={{ color: p.colorText }}>{p.name}</span>
          <BottleSvg textColor={p.colorText} name={p.name} />
        </div>
      )}
      <div className="product-info">
        <div>
          <div className="product-house">{p.house}</div>
          <div className="product-name">{p.name}</div>
          {p.inspiredBy && <div className="product-inspired">Inspirado en {p.inspiredBy}</div>}
        </div>
        <div className="stars">
          {Array.from({ length: starCount }).map((_, i) => <span key={i}>★</span>)}
          <span className="review-count">({p.reviewCount})</span>
        </div>
        <div className="quality-selector">
          <div className="quality-label">Presentación</div>
          <div className="quality-btns">
            {PRESENTACIONES.map((o) => (
              <button
                key={o.key}
                className={`quality-btn${pres === o.key ? ' active' : ''}`}
                onClick={() => selectPres(o.key)}
              >{o.label}</button>
            ))}
          </div>
        </div>
        <div className="product-footer">
          <div className="product-price" ref={priceRef}>{fmt(price)}</div>
          <button
            className="add-cart-btn"
            onClick={handleAdd}
            style={added ? { background: '#EDD475', color: '#C1E1DC' } : undefined}
          >{added ? '✓ Añadido' : '+ Añadir'}</button>
        </div>
      </div>
    </div>
  );
}
