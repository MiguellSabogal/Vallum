'use client';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'vallum_cart';

// Cada línea del carrito es única por producto + calidad
function lineKey(id, quality) {
  return `${id}::${quality}`;
}

export function CartProvider({ children }) {
  // Importante para SSR: el primer render es SIEMPRE vacío (igual en servidor y
  // cliente, para que coincida la hidratación). El carrito de localStorage se
  // carga después, en el efecto de abajo (solo corre en el navegador).
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  // Carga el carrito guardado tras montar (cliente).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) setItems(saved);
    } catch { /* ignora */ }
    setHydrated(true);
  }, []);

  // Persistencia: solo escribe una vez cargado, para no pisar el carrito guardado.
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product, quality, price) => {
    setItems((prev) => {
      const key = lineKey(product.id, quality);
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) => (it.key === key ? { ...it, qty: it.qty + 1 } : it));
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          house: product.house,
          quality,
          price,
          qty: 1,
          imageUrl: product.imageUrl || '',
          colorBg: product.colorBg || '#1A1A1A',
          colorText: product.colorText || '#D4AF37',
        },
      ];
    });
    setOpen(true); // abre el panel al añadir, para que se vea el carrito
  }, []);

  const changeQty = useCallback((key, delta) => {
    setItems((prev) =>
      prev
        .map((it) => (it.key === key ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items]);
  const total = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, count, total, open, setOpen, addItem, changeQty, removeItem, clear }),
    [items, count, total, open, addItem, changeQty, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
