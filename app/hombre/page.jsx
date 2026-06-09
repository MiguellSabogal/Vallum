import CollectionView from '../../src/components/CollectionView.jsx';

export const metadata = {
  title: 'Perfumes para Hombre',
  description: 'Fragancias masculinas inspiradas en los íconos: maderas, especias y carácter. Réplicas de autor con gran fijación.',
};

export default function HombrePage() {
  return (
    <CollectionView
      gender="hombre"
      eyebrow="Colección · Hombre"
      title={<>Fragancias para <em>Él</em></>}
      subtitle="Maderas, especias y carácter. Una selección masculina inspirada en los perfumes más deseados del mundo."
    />
  );
}
