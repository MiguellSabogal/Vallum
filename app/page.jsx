import Header from '../src/components/Header.jsx';
import Hero from '../src/components/Hero.jsx';
import Marquee from '../src/components/Marquee.jsx';
import Calidades from '../src/components/Calidades.jsx';
import Catalog from '../src/components/Catalog.jsx';
import Footer from '../src/components/Footer.jsx';
import CartDrawer from '../src/components/CartDrawer.jsx';
import BottleSceneClient from '../src/components/BottleSceneClient.jsx';
import ScrollReveal from '../src/components/ScrollReveal.jsx';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:3001';

// Se ejecuta EN EL SERVIDOR: los productos llegan ya dentro del HTML (SEO).
async function getProducts() {
  try {
    const res = await fetch(`${API_ORIGIN}/api/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <BottleSceneClient />
      <Header />
      <Hero />
      <Marquee />
      <Calidades />
      <Catalog products={products} loading={false} error={null} />
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={products.length} />
    </>
  );
}
