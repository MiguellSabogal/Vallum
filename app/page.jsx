import Header from '../src/components/Header.jsx';
import Hero from '../src/components/Hero.jsx';
import Marquee from '../src/components/Marquee.jsx';
import Calidades from '../src/components/Calidades.jsx';
import Catalog from '../src/components/Catalog.jsx';
import Footer from '../src/components/Footer.jsx';
import CartDrawer from '../src/components/CartDrawer.jsx';
import BottleSceneClient from '../src/components/BottleSceneClient.jsx';
import ScrollReveal from '../src/components/ScrollReveal.jsx';
import { getAllProducts } from '../server/store.js';

// SSR por petición: refleja siempre el estado actual de la BD (cambios del admin).
export const dynamic = 'force-dynamic';

import { paginate } from '../src/lib/paginate.js';

// Server Component: consulta la BD directamente (sin HTTP). Los productos
// llegan ya dentro del HTML → SEO.
export default async function HomePage({ searchParams }) {
  const all = await getAllProducts();
  const { items: products, page, totalPages, totalCount } = paginate(all, searchParams?.page);

  return (
    <>
      <BottleSceneClient />
      <Header />
      <Hero />
      <Marquee />
      <Calidades />
      <Catalog
        products={products}
        loading={false}
        error={null}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        basePath="/"
      />
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={`${page}-${products.length}`} />
    </>
  );
}
