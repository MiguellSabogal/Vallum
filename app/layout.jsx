import Providers from './providers.jsx';

// CSS global en el mismo orden que la versión Vite (base primero).
import '../src/styles/base.css';
import '../src/styles/header.css';
import '../src/styles/hero.css';
import '../src/styles/marquee.css';
import '../src/styles/calidades.css';
import '../src/styles/catalog.css';
import '../src/styles/footer.css';
import '../src/styles/cart.css';
import '../src/styles/payment.css';
import '../src/styles/admin.css';

// Metadata por defecto del sitio (Next la inyecta en el <head> server-side).
export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'VALLUM — Perfumería de lujo inspirada en íconos',
    template: '%s · VALLUM',
  },
  description:
    'Fragancias inspiradas en los perfumes más icónicos del mundo. Carácter, fijación y elegancia, a tu alcance.',
  openGraph: {
    title: 'VALLUM — Perfumería de lujo inspirada en íconos',
    description: 'Réplicas de autor inspiradas en las fragancias más deseadas del mundo.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'VALLUM',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
