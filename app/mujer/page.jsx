import CollectionView from '../../src/components/CollectionView.jsx';

export const metadata = {
  title: 'Perfumes para Mujer',
  description: 'Fragancias femeninas inspiradas en los íconos: florales, dulces y elegantes. Réplicas de autor a tu alcance.',
};

export default function MujerPage() {
  return (
    <CollectionView
      gender="mujer"
      eyebrow="Colección · Mujer"
      title={<>Fragancias para <em>Ella</em></>}
      subtitle="Florales, dulces y elegantes. Las esencias femeninas más icónicas del mundo, a tu alcance."
    />
  );
}
