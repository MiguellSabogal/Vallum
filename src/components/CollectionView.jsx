import Header from './Header.jsx';
import Catalog from './Catalog.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import BottleSceneClient from './BottleSceneClient.jsx';
import ScrollReveal from './ScrollReveal.jsx';
import { getAllProducts } from '../../server/store.js';

// Server Component: consulta la BD directamente y filtra por género (SSR).
export default async function CollectionView({ gender, eyebrow, title, subtitle }) {
  const all = await getAllProducts();
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
