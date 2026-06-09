// Formato de precio en pesos colombianos, identico a la version vanilla
export function fmt(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

// Iniciales del perfume (hasta 2 letras) para la etiqueta del frasco SVG
export function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
