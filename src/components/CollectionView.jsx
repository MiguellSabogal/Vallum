import Header from './Header.jsx';
import Catalog from './Catalog.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import BottleSceneClient from './BottleSceneClient.jsx';
import ScrollReveal from './ScrollReveal.jsx';
import { getAllProducts } from '../../server/store.js';
import { paginate } from '../lib/paginate.js';

// Server Component: consulta la BD directamente y filtra por género (SSR).
export default async function CollectionView({ gender, eyebrow, title, subtitle, searchParams }) {
  const all = await getAllProducts();
  const filtered = all.filter((p) => p.gender === gender);
  const { items: products, page, totalPages, totalCount } = paginate(filtered, searchParams?.page);

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
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        basePath={`/${gender}`}
      />
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={`${page}-${products.length}`} />
    </>
  );
}
