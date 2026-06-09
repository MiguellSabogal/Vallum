'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrderByRef, mockPay } from '../../../src/api/orders.js';
import { fmt } from '../../../src/utils/format.js';

export default function PaymentPage({ params }) {
  const reference = params.reference;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // 'aprobado' | 'rechazado'

  useEffect(() => {
    getOrderByRef(reference)
      .then((o) => {
        setOrder(o);
        if (o.paymentStatus === 'aprobado' || o.paymentStatus === 'rechazado') {
          setResult(o.paymentStatus);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reference]);

  async function pay(outcome) {
    setProcessing(true);
    setError('');
    try {
      const res = await mockPay(reference, outcome);
      setResult(res.paymentStatus);
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="pay-wrap">
      <div className="pay-card">
        <div className="pay-logo">VALLU<span>M</span></div>

        {loading ? (
          <p className="pay-muted">Cargando…</p>
        ) : error && !order ? (
          <p className="pay-error">{error}</p>
        ) : result === 'aprobado' ? (
          <>
            <div className="pay-icon pay-icon-ok">✓</div>
            <h1>¡Pago aprobado!</h1>
            <p className="pay-muted">Tu pedido <strong>{reference}</strong> está confirmado. Te contactaremos para el envío.</p>
            <Link href="/" className="pay-btn pay-btn-primary">Volver a la tienda</Link>
          </>
        ) : result === 'rechazado' ? (
          <>
            <div className="pay-icon pay-icon-bad">×</div>
            <h1>Pago rechazado</h1>
            <p className="pay-muted">El pedido <strong>{reference}</strong> se canceló y el stock fue liberado. Puedes intentarlo de nuevo desde la tienda.</p>
            <Link href="/" className="pay-btn">Volver a la tienda</Link>
          </>
        ) : (
          <>
            <p className="pay-badge">Pasarela de pago · modo demo</p>
            <h1>Pagar pedido</h1>
            <p className="pay-ref">{reference}</p>
            <div className="pay-amount">
              <span>Total a pagar</span>
              <strong>{order ? fmt(order.total) : '—'}</strong>
            </div>
            {error && <p className="pay-error">{error}</p>}
            <button className="pay-btn pay-btn-primary" disabled={processing} onClick={() => pay('aprobado')}>
              {processing ? 'Procesando…' : 'Pagar ahora'}
            </button>
            <button className="pay-btn pay-btn-ghost" disabled={processing} onClick={() => pay('rechazado')}>
              Simular pago rechazado
            </button>
            <p className="pay-note">El pago se confirma por webhook firmado del servidor, no desde esta página.</p>
          </>
        )}
      </div>
    </div>
  );
}
