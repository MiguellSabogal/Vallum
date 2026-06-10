import Header from '../../src/components/Header.jsx';
import Footer from '../../src/components/Footer.jsx';
import CartDrawer from '../../src/components/CartDrawer.jsx';
import BottleSceneClient from '../../src/components/BottleSceneClient.jsx';
import ScrollReveal from '../../src/components/ScrollReveal.jsx';

export const metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Resolvemos tus dudas sobre nuestras réplicas, calidades AA y AAA, balas recargadas, envíos en Bogotá y formas de pago.',
};

function Faq({ q, children }) {
  return (
    <details className="faq-item">
      <summary>{q}</summary>
      <div className="faq-answer">{children}</div>
    </details>
  );
}

export default function PreguntasFrecuentesPage() {
  return (
    <>
      <BottleSceneClient />
      <Header />
      <section className="legal-page" id="faq">
        <div className="section-inner">
          <div className="section-eyebrow">Ayuda</div>
          <h1 className="section-title">Preguntas <em className="text-gold">Frecuentes</em></h1>

          <h2 className="legal-subtitle" id="productos">Productos y calidades</h2>
          <Faq q="¿Qué son exactamente los perfumes Vallum?">
            Son réplicas tipo inspiración de las fragancias más reconocidas del mundo,
            elaboradas con materias primas seleccionadas para lograr la mayor similitud
            olfativa posible. No vendemos perfumes originales ni tenemos relación con
            las casas que los fabrican.
          </Faq>
          <Faq q="¿Cuál es la diferencia entre calidad AA y AAA?">
            La calidad AAA (Prestige) alcanza una similitud olfativa cercana al 98%, con
            fijación de 8 a 12 horas y alta concentración de esencia. La calidad AA
            (Signature) replica fielmente las notas principales, con fijación de 4 a 6
            horas — ideal para uso diario. Puedes comparar ambas en la página de Calidades.
          </Faq>
          <Faq q="¿Qué son las balas recargadas?">
            Atomizadores de bolsillo de 50ml ($38.000) y 100ml ($48.000) cargados con la
            fragancia que elijas, con alta concentración de esencia. Puedes añadirlas desde
            la tarjeta de cualquier perfume del catálogo, eligiendo la presentación
            &quot;Bala 50ml&quot; o &quot;Bala 100ml&quot;.
          </Faq>

          <h2 className="legal-subtitle" id="envios">Envíos</h2>
          <Faq q="¿A qué ciudades hacen envíos?">
            Por el momento realizamos envíos <strong>únicamente en la ciudad de Bogotá</strong>.
            Si estás fuera de Bogotá, escríbenos por WhatsApp y te avisaremos cuando
            ampliemos la cobertura.
          </Faq>
          <Faq q="¿Cuánto tarda en llegar mi pedido?">
            Los pedidos dentro de Bogotá se entregan normalmente entre 1 y 3 días hábiles
            después de confirmado el pago. Te contactaremos por WhatsApp para coordinar la entrega.
          </Faq>

          <h2 className="legal-subtitle" id="pagos">Pedidos y pagos</h2>
          <Faq q="¿Cómo hago un pedido?">
            Añade tus fragancias al carrito eligiendo presentación (frasco AA/AAA o bala),
            completa tus datos de contacto y dirección en Bogotá, y confirma el pedido.
            Recibirás una referencia para hacer seguimiento.
          </Faq>
          <Faq q="¿Puedo cambiar o cancelar mi pedido?">
            Sí, siempre que aún no haya sido despachado. Escríbenos por WhatsApp con tu
            número de referencia y lo ajustamos.
          </Faq>

          <h2 className="legal-subtitle" id="calidad">Garantía de calidad</h2>
          <Faq q="¿Qué garantía tienen los productos?">
            Todos los perfumes salen revisados y sellados. Si tu producto llega con un
            defecto de fábrica (atomizador dañado, frasco roto o derrame), escríbenos por
            WhatsApp dentro de los 3 días siguientes a la entrega con fotos y tu referencia
            de pedido, y te lo reponemos.
          </Faq>
          <Faq q="¿Cuánto dura un perfume?">
            Bien almacenado (lejos del calor y la luz directa), un perfume conserva sus
            propiedades entre 2 y 3 años. Recomendamos aplicarlo en puntos de pulso sobre
            la piel hidratada para maximizar la fijación.
          </Faq>
        </div>
      </section>
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={1} />
    </>
  );
}
