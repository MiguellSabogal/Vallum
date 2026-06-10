import Balas from './Balas.jsx';

function StatRow({ label, width, value }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-bar-wrap">
        <div className="stat-bar-bg"><div className="stat-bar-fill" data-width={width}></div></div>
        <span className="stat-val">{value}</span>
      </div>
    </div>
  );
}

export default function Calidades({ topPad = false }) {
  return (
    <section className={`calidades${topPad ? ' calidades-page' : ''}`} id="calidades">
      <div className="section-inner">
        <div className="section-eyebrow">Nuestros Niveles</div>
        <h2 className="section-title">Elige tu <em className="text-gold">calidad</em></h2>
        <p className="calidades-intro">
          Dos niveles de excelencia, cada uno con tecnología de replicación olfativa avanzada y materias primas cuidadosamente seleccionadas.
        </p>

        <div className="calidades-grid">

          {/* AAA */}
          <div className="calidad-card featured">
            <span className="calidad-badge badge-aaa">Calidad AAA</span>
            <div className="calidad-name">Prestige</div>
            <div className="calidad-price-range">Desde $120.000 COP</div>

            <div className="calidad-stats">
              <StatRow label="Similitud olfativa" width="98" value="98%" />
              <StatRow label="Fijación (horas)" width="92" value="8-12h" />
              <StatRow label="Concentración" width="95" value="Alta" />
            </div>

            <ul className="calidad-features">
              <li>Materias primas importadas de grado premium</li>
              <li>Fórmula desarrollada con cromatografía de gas</li>
              <li>Packaging idéntico al original, sellado de fábrica</li>
              <li>Estela proyectante — te notan al entrar</li>
              <li>Certificado de calidad incluido</li>
            </ul>
          </div>

          {/* AA */}
          <div className="calidad-card">
            <span className="calidad-badge badge-aa">Calidad AA</span>
            <div className="calidad-name">Signature</div>
            <div className="calidad-price-range">Desde $70.000 COP</div>

            <div className="calidad-stats">
              <StatRow label="Similitud olfativa" width="90" value="90%" />
              <StatRow label="Fijación (horas)" width="60" value="4-6h" />
              <StatRow label="Concentración" width="70" value="Media" />
            </div>

            <ul className="calidad-features">
              <li>Notas principales perfectamente replicadas</li>
              <li>Ideal para uso diario o laboral</li>
              <li>Presentación cuidada y elegante</li>
              <li>Relación calidad-precio excepcional</li>
              <li>Mismo aroma base que el original</li>
            </ul>
          </div>

        </div>

        <Balas />
      </div>
    </section>
  );
}
