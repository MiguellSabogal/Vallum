'use client';
import { useEffect, useState } from 'react';
import { getOrders, getOrder, updateOrderStatus } from '../api/orders.js';
import { fmt } from '../utils/format.js';

const STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

function isAuthError(message) {
  return message === 'No autorizado.' || message === 'Sesión expirada.';
}

export default function AdminOrders({ token, onAuthError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);

  function load() {
    setLoading(true);
    getOrders(token)
      .then((data) => { setOrders(data); setError(''); })
      .catch((e) => { if (isAuthError(e.message)) onAuthError(); setError(e.message); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function toggle(order) {
    if (expandedId === order.id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(order.id);
    setDetail(null);
    try {
      setDetail(await getOrder(order.id, token));
    } catch (e) {
      if (isAuthError(e.message)) onAuthError();
      setError(e.message);
    }
  }

  async function changeStatus(order, status) {
    try {
      const updated = await updateOrderStatus(order.id, status, token);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
    } catch (e) {
      if (isAuthError(e.message)) onAuthError();
      setError(e.message);
    }
  }

  if (loading) return <p className="admin-msg">Cargando pedidos…</p>;

  return (
    <section className="admin-card">
      <h2>Pedidos ({orders.length})</h2>
      {error && <p className="admin-msg admin-msg-error">{error}</p>}
      {orders.length === 0 ? (
        <p className="admin-msg">Todavía no hay pedidos.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ref.</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Fecha</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <Row
                key={o.id}
                order={o}
                expanded={expandedId === o.id}
                detail={expandedId === o.id ? detail : null}
                onToggle={() => toggle(o)}
                onStatus={(s) => changeStatus(o, s)}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Row({ order, expanded, detail, onToggle, onStatus }) {
  return (
    <>
      <tr>
        <td><strong>{order.reference}</strong></td>
        <td>{order.customerName}</td>
        <td>{fmt(order.total)}</td>
        <td><span className={`order-pay order-pay-${order.paymentStatus}`}>{order.paymentStatus}</span></td>
        <td>{(order.createdAt || '').slice(0, 10)}</td>
        <td>
          <select
            className={`order-status order-status-${order.status}`}
            value={order.status}
            onChange={(e) => onStatus(e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td className="admin-row-actions">
          <button className="admin-btn admin-btn-sm" onClick={onToggle}>
            {expanded ? 'Ocultar' : 'Ver'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="order-detail-row">
          <td colSpan={7}>
            {!detail ? (
              <span className="admin-msg">Cargando detalle…</span>
            ) : (
              <div className="order-detail">
                <div className="order-detail-customer">
                  <div>{detail.customerEmail} · {detail.customerPhone}</div>
                  <div>{detail.address}, {detail.city}</div>
                  {detail.notes && <div><em>Nota: {detail.notes}</em></div>}
                </div>
                <ul className="order-detail-items">
                  {detail.items.map((it) => (
                    <li key={it.id}>
                      <span>{it.productName} · {it.quality} × {it.qty}</span>
                      <span>{fmt(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
