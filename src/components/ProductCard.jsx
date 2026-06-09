'use client';
import { useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { fmt } from '../utils/format.js';
import BottleSvg from './BottleSvg.jsx';

export default function ProductCard({ product: p }) {
  const { addItem } = useCart();
  const [quality, setQuality] = useState('AAA');
  const [added, setAdded] = useState(false);
  const priceRef = useRef(null);
  const addTimer = useRef(null);

  const price = quality === 'AAA' ? p.priceAAA : p.priceAA;

  function selectQuality(q) {
    if (q === quality) return;
    setQuality(q);
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
    addItem(p, quality, price);
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
        <img src={p.imageUrl} alt={p.name} className="product-visual" />
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
          <div className="quality-label">Calidad</div>
          <div className="quality-btns">
            <button
              className={`quality-btn${quality === 'AA' ? ' active' : ''}`}
              onClick={() => selectQuality('AA')}
            >AA</button>
            <button
              className={`quality-btn${quality === 'AAA' ? ' active' : ''}`}
              onClick={() => selectQuality('AAA')}
            >AAA</button>
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
