'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, login, me, createProduct, updateProduct, deleteProduct } from '../../src/api/products.js';
import AdminOrders from '../../src/components/AdminOrders.jsx';
import { fmt } from '../../src/utils/format.js';

const EMPTY = {
  house: 'Vallum', name: '', inspiredBy: '', gender: 'unisex', isNew: false,
  priceAA: 0, priceAAA: 0, stock: 0, reviews: 5, reviewCount: 0,
  accentColor: '#EDD475', notes: '', colorBg: '#C1E1DC', colorText: '#EDD475',
  imageUrl: '',
};

export default function Admin() {
  // SSR-safe: no leer localStorage en el render inicial (en el servidor no existe).
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('productos'); // 'productos' | 'pedidos'

  function loadProducts() {
    getProducts().then(setProducts).catch((e) => setError(e.message));
  }

  useEffect(() => { loadProducts(); }, []);

  // Carga el token guardado tras montar (cliente).
  useEffect(() => { setToken(localStorage.getItem('vallum_token') || ''); }, []);

  // Valida el token guardado al cargar: si expiró o es inválido, cierra sesión.
  useEffect(() => {
    if (!token) return;
    me(token).catch(() => {
      localStorage.removeItem('vallum_token');
      setToken('');
    });
  }, [token]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const { token: tk } = await login(email, password);
      localStorage.setItem('vallum_token', tk);
      setToken(tk);
      setEmail('');
      setPassword('');
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('vallum_token');
    setToken('');
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ ...EMPTY, ...p, isNew: !!p.isNew });
    setMsg(''); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      if (editingId) {
        await updateProduct(editingId, form, token);
        setMsg(`"${form.name}" actualizado.`);
      } else {
        await createProduct(form, token);
        setMsg(`"${form.name}" creado.`);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      if (err.message === 'No autorizado.') handleLogout();
      setError(err.message);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`¿Borrar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    setMsg(''); setError('');
    try {
      await deleteProduct(p.id, token);
      setMsg(`"${p.name}" borrado.`);
      if (editingId === p.id) resetForm();
      loadProducts();
    } catch (err) {
      if (err.message === 'No autorizado.') handleLogout();
      setError(err.message);
    }
  }

  // ── Pantalla de login ───────────────────────────────
  if (!token) {
    return (
      <div className="admin-wrap">
        <div className="admin-login">
          <h1 className="admin-logo">VALLU<span>M</span> · Admin</h1>
          <form onSubmit={handleLogin}>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vallum.co"
                autoComplete="username"
                autoFocus
              />
            </label>
            <label className="admin-field">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de administrador"
                autoComplete="current-password"
              />
            </label>
            {loginError && <p className="admin-msg admin-msg-error">{loginError}</p>}
            <button type="submit" className="admin-btn admin-btn-primary">Entrar</button>
          </form>
          <Link href="/" className="admin-back">← Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  // ── Panel de gestion ────────────────────────────────
  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1 className="admin-logo">VALLU<span>M</span> · Admin</h1>
        <div className="admin-header-actions">
          <Link href="/" className="admin-back">← Tienda</Link>
          <button className="admin-btn" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'productos' ? ' active' : ''}`}
          onClick={() => setTab('productos')}
        >Productos</button>
        <button
          className={`admin-tab${tab === 'pedidos' ? ' active' : ''}`}
          onClick={() => setTab('pedidos')}
        >Pedidos</button>
      </div>

      {tab === 'pedidos' ? (
        <AdminOrders token={token} onAuthError={handleLogout} />
      ) : (
      <>
      {(msg || error) && (
        <p className={`admin-msg ${error ? 'admin-msg-error' : 'admin-msg-ok'}`}>{error || msg}</p>
      )}

      <section className="admin-card">
        <h2>{editingId ? `Editar producto #${editingId}` : 'Nuevo producto'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <label className="admin-field"><span>Casa / Colección *</span>
            <input value={form.house} onChange={(e) => setField('house', e.target.value)} required />
          </label>
          <label className="admin-field"><span>Nombre *</span>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </label>
          <label className="admin-field"><span>Inspirado en</span>
            <input value={form.inspiredBy} onChange={(e) => setField('inspiredBy', e.target.value)} placeholder="Baccarat Rouge 540 · Maison Francis Kurkdjian" />
          </label>
          <label className="admin-field"><span>Género</span>
            <select value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
              <option value="unisex">Unisex</option>
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
            </select>
          </label>
          <label className="admin-field admin-check">
            <input type="checkbox" checked={form.isNew} onChange={(e) => setField('isNew', e.target.checked)} />
            <span>Marcar como "Nuevo"</span>
          </label>
          <label className="admin-field"><span>Precio AA (COP)</span>
            <input type="number" value={form.priceAA} onChange={(e) => setField('priceAA', e.target.value)} />
          </label>
          <label className="admin-field"><span>Precio AAA (COP)</span>
            <input type="number" value={form.priceAAA} onChange={(e) => setField('priceAAA', e.target.value)} />
          </label>
          <label className="admin-field"><span>Stock (unidades)</span>
            <input type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
          </label>
          <label className="admin-field"><span>Estrellas (1-5)</span>
            <input type="number" min="1" max="5" value={form.reviews} onChange={(e) => setField('reviews', e.target.value)} />
          </label>
          <label className="admin-field"><span># Reseñas</span>
            <input type="number" value={form.reviewCount} onChange={(e) => setField('reviewCount', e.target.value)} />
          </label>
          <label className="admin-field"><span>Notas olfativas</span>
            <input value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Jazmín · Safran · Cedro" />
          </label>
          <label className="admin-field"><span>Color de acento</span>
            <input type="color" value={form.accentColor} onChange={(e) => setField('accentColor', e.target.value)} />
          </label>
          <label className="admin-field"><span>Fondo de la card</span>
            <input type="color" value={form.colorBg} onChange={(e) => setField('colorBg', e.target.value)} />
          </label>
          <label className="admin-field"><span>Color del frasco/texto</span>
            <input type="color" value={form.colorText} onChange={(e) => setField('colorText', e.target.value)} />
          </label>
          <label className="admin-field"><span>URL de la imagen</span>
            <input type="url" value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
          </label>

          {form.imageUrl && (
            <div className="admin-image-preview">
              <img src={form.imageUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
              <p>Imagen cargada ({form.imageUrl.split('/').pop()})</p>
            </div>
          )}

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn-primary">
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </button>
            {editingId && (
              <button type="button" className="admin-btn" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-card">
        <h2>Productos ({products.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Casa</th><th>AA</th><th>AAA</th><th>Stock</th><th>Nuevo</th><th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.house}</td>
                <td>{fmt(p.priceAA)}</td>
                <td>{fmt(p.priceAAA)}</td>
                <td className={p.stock === 0 ? 'stock-zero' : undefined}>{p.stock}</td>
                <td>{p.isNew ? '✓' : ''}</td>
                <td className="admin-row-actions">
                  <button className="admin-btn admin-btn-sm" onClick={() => startEdit(p)}>Editar</button>
                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(p)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </>
      )}
    </div>
  );
}
