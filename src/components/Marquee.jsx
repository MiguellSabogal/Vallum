import { Fragment } from 'react';

const ITEMS = [
  'ROUGE 540', 'TRIUNFO', 'ORQUÍDEA NOIR', 'OUD REAL',
  'AZUR', 'INDÓMITO', 'LIBERTAD', 'BELLA VIDA',
];

export default function Marquee() {
  // Se duplica la lista (x2) para que el bucle del marquee sea continuo, igual que el original
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-track">
        {loop.map((label, i) => (
          <Fragment key={i}>
            <span>{label}</span>
            <span className="dot">◆</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
