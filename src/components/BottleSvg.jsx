import { initials } from '../utils/format.js';

// Equivalente JSX de la funcion bottleSVG() de la version vanilla
export default function BottleSvg({ textColor, name }) {
  const letters = initials(name);
  return (
    <svg className="bottle-svg" width="100" height="160" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="10" width="24" height="18" rx="4" fill={textColor} opacity="0.4" />
      <rect x="44" y="5" width="12" height="10" rx="3" fill={textColor} opacity="0.3" />
      <rect x="20" y="28" width="60" height="120" rx="10" fill={textColor} opacity="0.12" />
      <rect x="20" y="28" width="60" height="120" rx="10" fill="none" stroke={textColor} strokeWidth="1.2" opacity="0.3" />
      <rect x="26" y="38" width="48" height="70" rx="4" fill="none" stroke={textColor} strokeWidth="0.6" opacity="0.2" />
      <text x="50" y="82" textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Bebas Neue',sans-serif" fontSize="18" letterSpacing="2"
        fill={textColor} opacity="0.5">{letters}</text>
      <rect x="32" y="120" width="36" height="1" fill={textColor} opacity="0.15" />
    </svg>
  );
}
