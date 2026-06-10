import Header from '../../src/components/Header.jsx';
import Footer from '../../src/components/Footer.jsx';
import CartDrawer from '../../src/components/CartDrawer.jsx';
import BottleSceneClient from '../../src/components/BottleSceneClient.jsx';
import ScrollReveal from '../../src/components/ScrollReveal.jsx';

export const metadata = {
  title: 'Términos de Uso',
  description: 'Condiciones de uso y compra en VALLUM: naturaleza de los productos, precios, envíos en Bogotá y políticas de cambio.',
};

export default function TerminosPage() {
  return (
    <>
      <BottleSceneClient />
      <Header />
      <section className="legal-page" id="terminos">
        <div className="section-inner">
          <div className="section-eyebrow">Legal</div>
          <h1 className="section-title">Términos de <em className="text-gold">Uso</em></h1>
          <p className="legal-updated">Última actualización: junio de 2026</p>

          <h2 className="legal-subtitle">1. Aceptación</h2>
          <p className="legal-text">
            Al navegar este sitio o realizar un pedido en VALLUM aceptas estos términos.
            Si no estás de acuerdo con alguno de ellos, por favor no utilices el sitio.
          </p>

          <h2 className="legal-subtitle">2. Naturaleza de los productos</h2>
          <p className="legal-text">
            VALLUM comercializa perfumes tipo réplica / inspiración. Nuestros productos
            <strong> no son originales</strong> y VALLUM no tiene afiliación, patrocinio ni
            relación comercial alguna con las casas de perfumería mencionadas. Los nombres
            de fragancias y marcas originales se usan únicamente como referencia olfativa
            para describir el aroma del producto.
          </p>

          <h2 className="legal-subtitle">3. Precios y pagos</h2>
          <p className="legal-text">
            Todos los precios están expresados en pesos colombianos (COP) e incluyen los
            impuestos aplicables. Los precios vigentes son los publicados en el sitio al
            momento de confirmar el pedido. VALLUM puede modificarlos en cualquier momento
            sin afectar pedidos ya confirmados.
          </p>

          <h2 className="legal-subtitle">4. Envíos</h2>
          <p className="legal-text">
            Realizamos entregas <strong>únicamente en la ciudad de Bogotá</strong>. El plazo
            estimado de entrega es de 1 a 3 días hábiles tras la confirmación del pago. Es
            responsabilidad del cliente suministrar una dirección y teléfono de contacto
            correctos; los intentos de entrega fallidos por datos erróneos pueden generar
            costos adicionales.
          </p>

          <h2 className="legal-subtitle">5. Cambios y productos defectuosos</h2>
          <p className="legal-text">
            Por tratarse de productos cosméticos de uso personal, no se aceptan devoluciones
            por cambio de opinión. Si el producto llega con defecto de fábrica (atomizador
            dañado, frasco roto o derrame), notifícalo por WhatsApp dentro de los 3 días
            siguientes a la entrega, con fotos y número de referencia, y haremos la reposición
            sin costo.
          </p>

          <h2 className="legal-subtitle">6. Uso del sitio</h2>
          <p className="legal-text">
            Te comprometes a usar el sitio de forma lícita, a no interferir con su
            funcionamiento y a suministrar información veraz en tus pedidos. VALLUM puede
            rechazar o cancelar pedidos ante sospecha de fraude.
          </p>

          <h2 className="legal-subtitle">7. Datos personales</h2>
          <p className="legal-text">
            Los datos que nos entregas (nombre, teléfono, dirección, correo) se usan
            exclusivamente para procesar y entregar tu pedido y brindarte soporte. No los
            compartimos con terceros distintos a los necesarios para la entrega, conforme a
            la Ley 1581 de 2012 de protección de datos personales de Colombia.
          </p>

          <h2 className="legal-subtitle">8. Modificaciones y contacto</h2>
          <p className="legal-text">
            VALLUM puede actualizar estos términos en cualquier momento; la versión vigente
            será siempre la publicada en esta página. Para cualquier duda, escríbenos por
            WhatsApp o al correo hola@vallum.co.
          </p>
        </div>
      </section>
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={1} />
    </>
  );
}
