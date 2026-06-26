// Siembra de perfumes árabes recomendados (Lattafa, Armaf, Rasasi, Afnan,
// Al Haramain, Maison Alhambra, Khadlaj, Swiss Arabian, Bharara).
// Idempotente: omite los que ya existan por nombre exacto.
// Uso: node scripts/seed_arabes.mjs            (BD local por defecto)
//      DATABASE_URL=... node scripts/seed_arabes.mjs   (otra BD, p. ej. Neon)
import pg from 'pg';

const DB = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/vallum';
const AA = 40000, AAA = 60000, STOCK = 100;

// accent/bg/text por familia olfativa, para no repetir a mano
const DARK = { accentColor: '#8B5A1A', colorBg: '#1A0E00', colorText: '#C4842A' }; // oud/ámbar
const GOLD = { accentColor: '#D4AF37', colorBg: '#1A1000', colorText: '#D4AF37' }; // dorado/dulce
const ROSE = { accentColor: '#E8A0B0', colorBg: '#1A0A10', colorText: '#E8B0C0' }; // floral/rosa
const BLUE = { accentColor: '#3A6EA5', colorBg: '#000A1A', colorText: '#6AA0D0' }; // fresco/acuático
const RED  = { accentColor: '#B33A2A', colorBg: '#1A0600', colorText: '#D45A40' }; // frutal/rojo
const GREEN= { accentColor: '#5A8B3A', colorBg: '#0A1400', colorText: '#88C04A' }; // cítrico/verde

const P = (house, name, inspiredBy, gender, notes, c, isNew = false) =>
  ({ house, name, inspiredBy, gender, notes, isNew, ...c });

const PRODUCTS = [
  // ── HOMBRE ──────────────────────────────────────────────
  P('Lattafa', 'Qaed Al Fursan', 'Aventus · Creed', 'hombre', 'Piña · Abedul · Almizcle', RED),
  P('Lattafa', 'Qaed Al Fursan Unlimited', 'Aventus Cologne · Creed', 'hombre', 'Cítricos · Piña · Ámbar', GREEN),
  P('Lattafa', 'Ansaam Gold', 'Ámbar especiado', 'hombre', 'Especias · Maderas · Ámbar', GOLD),
  P('Lattafa', 'Fakhar Black', 'Le Male Le Parfum · JPG', 'hombre', 'Lavanda · Vainilla · Ámbar', DARK),
  P('Lattafa', 'Eternal Oud', 'Oud floral', 'hombre', 'Oud · Rosa · Ámbar', DARK),
  P('Rasasi', 'Hawas for Him', 'Aventus · Creed', 'hombre', 'Bergamota · Manzana · Cardamomo', BLUE, true),
  P('Rasasi', 'Hawas Ice', 'Acuático fresco', 'hombre', 'Cítricos · Melón · Almizcle', BLUE),
  P('Rasasi', 'La Yuqawam Pour Homme', 'Tuscan Leather · Tom Ford', 'hombre', 'Azafrán · Cuero · Frambuesa', DARK),
  P('Rasasi', 'Daarej', 'Sauvage · Dior', 'hombre', 'Bergamota · Lavanda · Ambroxan', BLUE),
  P('Afnan', 'Supremacy Silver', 'Silver Mountain Water · Creed', 'hombre', 'Acuático · Grosella · Almizcle', BLUE),
  P('Afnan', 'Supremacy Not Only Intense', 'Frutal especiado', 'hombre', 'Manzana · Canela · Ámbar', RED),
  P('Afnan', '9pm Rebel', 'Ámbar oscuro', 'hombre', 'Especias · Cuero · Vainilla', DARK, true),
  P('Maison Alhambra', 'Jean Lowe Immortal', 'Aventus · Creed', 'hombre', 'Piña · Abedul · Musgo de roble', RED),
  P('Maison Alhambra', 'The Tux', 'Spicebomb · Viktor&Rolf', 'hombre', 'Tabaco · Canela · Cuero', DARK),
  P('Khadlaj', 'Magnum Extreme Blue', 'Bleu de Chanel', 'hombre', 'Cítricos · Pimienta rosa · Cedro', BLUE),
  P('Al Haramain', "L'Aventure", 'Aventus · Creed', 'hombre', 'Piña · Bergamota · Almizcle', GOLD),
  P('Al Haramain', "L'Aventure Knight", 'Cuero amaderado', 'hombre', 'Manzana · Cuero · Ámbar', DARK),
  P('Armaf', 'Ventana', 'Amaderado aromático', 'hombre', 'Cítricos · Salvia · Cedro', GREEN),
  P('Swiss Arabian', 'Shaghaf Oud', 'Oud dulce', 'hombre', 'Oud · Caramelo · Rosa', DARK),

  // ── MUJER ───────────────────────────────────────────────
  P('Lattafa', 'Ana Abiyedh Rouge', 'Floral frutal', 'mujer', 'Frambuesa · Rosa · Vainilla', ROSE),
  P('Lattafa', 'Ana Abiyedh Passion', 'Gourmand tropical', 'mujer', 'Maracuyá · Coco · Vainilla', RED, true),
  P('Lattafa', 'Eclaire', 'Delina · Parfums de Marly', 'mujer', 'Lichi · Rosa · Vainilla', ROSE, true),
  P('Lattafa', 'Yara Candy', 'Gourmand dulce', 'mujer', 'Fresa · Caramelo · Almizcle', ROSE),
  P('Lattafa', 'Najdia', 'Floral afrutado', 'mujer', 'Frutos rojos · Jazmín · Ámbar', RED),
  P('Lattafa', 'Nebras', 'Dulce avainillado', 'mujer', 'Caramelo · Vainilla · Pachulí', GOLD),
  P('Lattafa', 'Mayar', 'Floral almizclado', 'mujer', 'Azahar · Jazmín · Almizcle', ROSE),
  P('Lattafa', 'Mayar Cherry', 'Cereza almendrada', 'mujer', 'Cereza · Almendra · Vainilla', RED, true),
  P('Lattafa', 'Honor & Glory', 'Floral oriental', 'mujer', 'Frutos · Flores blancas · Ámbar', GOLD),
  P('Lattafa', 'Lattafa Rose', 'Rosa oriental', 'mujer', 'Rosa · Lichi · Almizcle', ROSE),
  P('Armaf', 'Miss Armaf Catwalk', 'Floral frutal', 'mujer', 'Mandarina · Jazmín · Vainilla', ROSE),
  P('Armaf', 'Miss Armaf Rose', 'Rosa frutal', 'mujer', 'Rosa · Frutos rojos · Almizcle', ROSE),
  P('Afnan', 'Turathi Blue', 'Floral afrutado', 'mujer', 'Frutas · Flores · Vainilla', BLUE),
  P('Swiss Arabian', 'Layali', 'Floral dulce', 'mujer', 'Frutos · Flores · Caramelo', ROSE),
  P('Al Haramain', 'Amber Oud Rose Gold', 'Oud floral', 'mujer', 'Rosa · Oud · Ámbar', ROSE),
  P('Bharara', 'Crimson', 'Frutal dulce', 'mujer', 'Frutos rojos · Vainilla · Almizcle', RED),

  // ── UNISEX ──────────────────────────────────────────────
  P('Lattafa', 'Khamrah Waha', 'Gourmand de dátiles', 'unisex', 'Dátiles · Miel · Ámbar', GOLD, true),
  P('Lattafa', 'Maahir', 'Layton · Parfums de Marly', 'unisex', 'Manzana · Lavanda · Vainilla', GOLD),
  P('Lattafa', 'Maahir Legacy', 'Amaderado especiado', 'unisex', 'Cardamomo · Maderas · Ámbar', DARK),
  P('Lattafa', 'Maahir Black', 'Oud amaderado', 'unisex', 'Oud · Cuero · Especias', DARK),
  P('Lattafa', 'Ajwad', 'Almizcle floral', 'unisex', 'Cítricos · Rosa · Almizcle', GOLD),
  P('Lattafa', 'Oud Mood', 'Oud intenso', 'unisex', 'Oud · Rosa · Pachulí', DARK),
  P('Lattafa', 'Teriaq', "Angels' Share · By Kilian", 'unisex', 'Coñac · Canela · Vainilla', DARK, true),
  P('Lattafa', 'Velvet Oud', 'Oud especiado', 'unisex', 'Oud · Azafrán · Maderas', DARK),
  P('Lattafa', 'Opulent Musk', 'Almizcle oriental', 'unisex', 'Almizcle · Especias · Ámbar', GOLD),
  P('Lattafa', 'Raghba', 'Vainilla oud', 'unisex', 'Vainilla · Oud · Sándalo', GOLD),
  P('Lattafa', 'Hayaati Al Maleki', 'Amaderado dulce', 'unisex', 'Frutos · Maderas · Vainilla', DARK),
  P('Afnan', 'Adwaa Al Sharq', 'Baccarat Rouge 540 · MFK', 'unisex', 'Azafrán · Jazmín · Ámbar', GOLD, true),
  P('Armaf', 'Club de Nuit Untold', 'Baccarat Rouge 540 · MFK', 'unisex', 'Azafrán · Jazmín · Cedro', GOLD),
  P('Armaf', 'Club de Nuit Sillage', 'Silver Mountain Water · Creed', 'unisex', 'Cítricos · Pimienta · Ámbar', BLUE),
  P('Al Haramain', 'Amber Oud', 'Oud ámbar', 'unisex', 'Oud · Ámbar · Maderas', DARK),
  P('Maison Alhambra', 'Salvo', 'Sauvage Elixir · Dior', 'unisex', 'Canela · Lavanda · Regaliz', DARK),
];

const cols = '(house, name, "inspiredBy", gender, "isNew", "priceAA", "priceAAA", reviews, "reviewCount", "accentColor", notes, "colorBg", "colorText", stock)';

async function main() {
  const c = new pg.Client({
    connectionString: DB,
    ssl: DB.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  await c.connect();
  let added = 0, skipped = 0;
  for (const p of PRODUCTS) {
    const exists = await c.query('SELECT 1 FROM products WHERE name = $1', [p.name]);
    if (exists.rowCount > 0) { skipped++; continue; }
    await c.query(
      `INSERT INTO products ${cols} VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [p.house, p.name, p.inspiredBy, p.gender, p.isNew, AA, AAA, 5,
       Math.floor(Math.random() * 400) + 50, p.accentColor, p.notes, p.colorBg, p.colorText, STOCK]
    );
    added++;
  }
  const total = await c.query('SELECT count(*) FROM products');
  console.log(`Añadidos: ${added} · Omitidos (ya existían): ${skipped} · Total en BD: ${total.rows[0].count}`);
  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
