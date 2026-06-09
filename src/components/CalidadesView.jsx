import Header from './Header.jsx';
import Calidades from './Calidades.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import BottleSceneClient from './BottleSceneClient.jsx';
import ScrollReveal from './ScrollReveal.jsx';

export default function CalidadesView() {
  return (
    <>
      <BottleSceneClient />
      <Header />
      <Calidades topPad />
      <Footer />
      <CartDrawer />
      <ScrollReveal dep={1} />
    </>
  );
}
