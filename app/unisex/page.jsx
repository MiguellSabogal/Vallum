import CollectionView from '../../src/components/CollectionView.jsx';

export const metadata = {
  title: 'Perfumes Unisex',
  description: 'Fragancias unisex inspiradas en los íconos: versátiles, para cualquier piel y ocasión.',
};

export default function UnisexPage() {
  return (
    <CollectionView
      gender="unisex"
      eyebrow="Colección · Unisex"
      title={<>Fragancias <em>Unisex</em></>}
      subtitle="Sin género, todo estilo. Perfumes versátiles que se adaptan a cualquier piel y ocasión."
    />
  );
}
