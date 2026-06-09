'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { count, setOpen } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const firstRender = useRef(true);

  // Pulso del badge cada vez que cambia la cantidad (salvo en el primer render)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <header>
      <div className="header-inner">
        <Link href="/" className="logo">VALLU<span>M</span></Link>
        <nav id="main-nav" className={navOpen ? 'open' : ''}>
          <a href="#catalogo" onClick={() => setNavOpen(false)}>Hombre</a>
          <a href="#catalogo" onClick={() => setNavOpen(false)}>Mujer</a>
          <a href="#catalogo" onClick={() => setNavOpen(false)}>Unisex</a>
          <a href="#calidades" onClick={() => setNavOpen(false)}>Calidades</a>
        </nav>
        <div className="header-actions">
          <button className="cart-btn" id="cart-toggle" aria-label="Carrito" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && (
              <span className={`cart-count${bump ? ' bump' : ''}`} id="cart-count">{count}</span>
            )}
          </button>
          <button
            className={`hamburger${navOpen ? ' open' : ''}`}
            id="hamburger"
            aria-label="Menú"
            onClick={() => setNavOpen((o) => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
