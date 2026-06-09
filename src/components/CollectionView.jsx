import Header from './Header.jsx';
import Catalog from './Catalog.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import BottleSceneClient from './BottleSceneClient.jsx';
import ScrollReveal from './ScrollReveal.jsx';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:3001';

// Server Component: pide los productos en el servidor y filtra por género (SSR).
async function getProducts() {
  try {
    const res = await fetch(`${API_ORIGIN}/api/products`, { cache: 'no-store' });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

export default async function CollectionView({ gender, eyebrow, title, subtitle }) {
  const all = await getProducts();
  const products = all.filter((p) => p.gender === gender);

  return (
    <>
      <BottleSceneClient />
      <Header />
      <Catalog
        products={products}
        loading={false}
        error={null}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        topPad
      />
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={products.length} />
    </>
  );
}
