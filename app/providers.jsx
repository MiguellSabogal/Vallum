'use client';
// Envuelve la app con los contextos de cliente (carrito).
import { CartProvider } from '../src/context/CartContext.jsx';

export default function Providers({ children }) {
  return <CartProvider>{children}</CartProvider>;
}
