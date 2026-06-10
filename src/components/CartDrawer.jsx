'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { fmt, initials } from '../utils/format.js';
import { createOrder, initiatePayment } from '../api/orders.js';

const EMPTY_CUSTOMER = { name: '', email: '', phone: '', address: '', city: 'Bogotá', notes: '' };

export default function CartDrawer() {
  const { items, total, count, open, setOpen, changeQty, removeItem, clear } = useCart();

  const [step, setStep] = useState('cart'); // 'cart' | 'checkout'
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cierra con Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Bloquea el scroll del fondo con el panel abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleClose() {
    setOpen(false);
    // Reinicia el flujo tras la animación de cierre
    setTimeout(() => { setStep('cart'); setError(''); }, 300);
  }

  function setField(name, value) {
    setCustomer((c) => ({ ...c, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const order = await createOrder({ customer, items });      // crea el pedido
      const { checkoutUrl } = await initiatePayment(order.id);   // inicia el pago
      clear();                                                   // vacía el carrito
      setCustomer(EMPTY_CUSTOMER);
      setOpen(false);
      window.location.href = checkoutUrl;                        // redirige a la pasarela
    } catch (err) {
      setError(err.message);   // p. ej. "Sin stock suficiente de …"
      setSubmitting(false);
    }
  }

  const title = step === 'checkout' ? 'Finalizar compra' : 'Tu carrito';

  return (
    <>
      <div className={`cart-overlay${open ? ' open' : ''}`} onClick={handleClose} />
      <aside className={`cart-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="cart-head">
          <h2>{title}{step === 'cart' && count > 0 && <span> ({count})</span>}</h2>
          <button className="cart-close" onClick={handleClose} aria-label="Cerrar">×</button>
        </div>

        {items.length === 0 ? (
          /* ── CARRITO VACÍO ── */
          <div className="cart-empty">
            <p>Tu carrito está vacío.</p>
            <button className="cart-continue" onClick={handleClose}>Seguir explorando</button>
          </div>
        ) : step === 'checkout' ? (
          /* ── PASO 2: DATOS DEL CLIENTE ── */
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-fields">
              <label className="checkout-field"><span>Nombre completo *</span>
                <input value={customer.name} onChange={(e) => setField('name', e.target.value)} required />
              </label>
              <label className="checkout-field"><span>Email *</span>
                <input type="email" value={customer.email} onChange={(e) => setField('email', e.target.value)} required />
              </label>
              <label className="checkout-field"><span>Teléfono *</span>
                <input value={customer.phone} onChange={(e) => setField('phone', e.target.value)} required />
              </label>
              <label className="checkout-field"><span>Dirección *</span>
                <input value={customer.address} onChange={(e) => setField('address', e.target.value)} required />
              </label>
              <label className="checkout-field"><span>Ciudad *</span>
                <input value={customer.city} onChange={(e) => setField('city', e.target.value)} required />
              </label>
              <label className="checkout-field"><span>Notas (opcional)</span>
                <textarea rows="2" value={customer.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Indicaciones de entrega, etc." />
              </label>
            </div>

            {error && <p className="checkout-error">{error}</p>}

            <div className="cart-foot">
              <p className="checkout-payinfo">
                💵 <strong>Pago contraentrega:</strong> pagas en efectivo al recibir tu
                pedido. Envíos únicamente en Bogotá.
              </p>
              <div className="cart-total"><span>Total a pagar al recibir</span><span>{fmt(total)}</span></div>
              <button type="submit" className="cart-checkout" disabled={submitting}>
                {submitting ? 'Procesando…' : 'Confirmar pedido'}
              </button>
              <button type="button" className="cart-clear" onClick={() => { setStep('cart'); setError(''); }}>
                ← Volver al carrito
              </button>
            </div>
          </form>
        ) : (
          /* ── PASO 1: CARRITO ── */
          <>
            <ul className="cart-items">
              {items.map((it) => (
                <li key={it.key} className="cart-item">
                  <div className="cart-item-thumb" style={{ background: it.imageUrl ? undefined : it.colorBg }}>
                    {it.imageUrl
                      ? <img src={it.imageUrl} alt={it.name} />
                      : <span style={{ color: it.colorText }}>{initials(it.name)}</span>}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-house">{it.house}</div>
                    <div className="cart-item-name">{it.name}</div>
                    <div className="cart-item-meta">Calidad {it.quality} · {fmt(it.price)}</div>
                    <div className="cart-qty">
                      <button onClick={() => changeQty(it.key, -1)} aria-label="Quitar uno">−</button>
                      <span>{it.qty}</span>
                      <button onClick={() => changeQty(it.key, 1)} aria-label="Añadir uno">+</button>
                      <button className="cart-item-remove" onClick={() => removeItem(it.key)}>Eliminar</button>
                    </div>
                  </div>
                  <div className="cart-item-line-total">{fmt(it.price * it.qty)}</div>
                </li>
              ))}
            </ul>

            <div className="cart-foot">
              <div className="cart-total"><span>Total</span><span>{fmt(total)}</span></div>
              <button className="cart-checkout" onClick={() => { setError(''); setStep('checkout'); }}>
                Finalizar pedido
              </button>
              <button className="cart-clear" onClick={clear}>Vaciar carrito</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
