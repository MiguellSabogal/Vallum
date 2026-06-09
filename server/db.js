// Capa de conexión a PostgreSQL (pool) + creación de esquema y semilla.
// Nota: las columnas camelCase van ENTRE COMILLAS para que Postgres no las pase
// a minúsculas (así las filas mantienen las claves que espera el frontend).
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './env.js';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  house         TEXT NOT NULL,
  name          TEXT NOT NULL,
  "inspiredBy"  TEXT NOT NULL DEFAULT '',
  gender        TEXT NOT NULL DEFAULT 'unisex',
  "isNew"       BOOLEAN NOT NULL DEFAULT false,
  "priceAA"     INTEGER NOT NULL DEFAULT 0,
  "priceAAA"    INTEGER NOT NULL DEFAULT 0,
  reviews       INTEGER NOT NULL DEFAULT 5,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "accentColor" TEXT NOT NULL DEFAULT '#D4AF37',
  notes         TEXT NOT NULL DEFAULT '',
  "colorBg"     TEXT NOT NULL DEFAULT '#1A1A1A',
  "colorText"   TEXT NOT NULL DEFAULT '#D4AF37',
  "imageUrl"    TEXT NOT NULL DEFAULT '',
  stock         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  "customerName"  TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'pendiente',
  "paymentStatus" TEXT NOT NULL DEFAULT 'pendiente',
  "paymentId"     TEXT NOT NULL DEFAULT '',
  "paymentMethod" TEXT NOT NULL DEFAULT '',
  total           INTEGER NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  "orderId"     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "productId"   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  "productName" TEXT NOT NULL,
  quality       TEXT NOT NULL,
  "unitPrice"   INTEGER NOT NULL,
  qty           INTEGER NOT NULL,
  "lineTotal"   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_orderid ON order_items("orderId");

CREATE TABLE IF NOT EXISTS webhook_events (
  "eventId"    TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const SEED = [
  { house: 'Vallum', name: 'Rouge 540',     inspiredBy: 'Baccarat Rouge 540 · Maison Francis Kurkdjian', gender: 'unisex', isNew: true,  priceAA: 80000, priceAAA: 150000, reviews: 5, reviewCount: 487, accentColor: '#D4AF37', notes: 'Jazmín · Safran · Cedro', colorBg: '#1A1A1A', colorText: '#D4AF37', stock: 120 },
  { house: 'Vallum', name: 'Triunfo',       inspiredBy: 'Aventus · Creed', gender: 'hombre', isNew: false, priceAA: 75000, priceAAA: 140000, reviews: 5, reviewCount: 362, accentColor: '#C0C0C0', notes: 'Piña · Abedul · Musgo', colorBg: '#0D0D0D', colorText: '#AFAFAF', stock: 80 },
  { house: 'Vallum', name: 'Orquídea Noir', inspiredBy: 'Black Orchid · Tom Ford', gender: 'unisex', isNew: false, priceAA: 78000, priceAAA: 145000, reviews: 5, reviewCount: 298, accentColor: '#7B4F7A', notes: 'Orquídea · Trufa · Patchouli', colorBg: '#200020', colorText: '#A070A0', stock: 40 },
  { house: 'Vallum', name: 'Oud Real',      inspiredBy: 'Oud Wood · Tom Ford', gender: 'unisex', isNew: false, priceAA: 82000, priceAAA: 155000, reviews: 5, reviewCount: 201, accentColor: '#8B6914', notes: 'Oud · Sándalo · Ámbar', colorBg: '#1A0F00', colorText: '#B58A28', stock: 5 },
  { house: 'Vallum', name: 'Azur',          inspiredBy: 'Bleu de Chanel · Chanel', gender: 'hombre', isNew: false, priceAA: 72000, priceAAA: 135000, reviews: 5, reviewCount: 543, accentColor: '#4A6D8A', notes: 'Toronja · Cedro · Incienso', colorBg: '#0A1520', colorText: '#6A9DC0', stock: 60 },
  { house: 'Vallum', name: 'Indómito',      inspiredBy: 'Sauvage · Dior', gender: 'hombre', isNew: true,  priceAA: 70000, priceAAA: 130000, reviews: 5, reviewCount: 621, accentColor: '#7AA0B0', notes: 'Bergamota · Pimienta · Ambroxan', colorBg: '#050F1A', colorText: '#8AB4C8', stock: 100 },
  { house: 'Vallum', name: 'Libertad',      inspiredBy: 'Libre · Yves Saint Laurent', gender: 'mujer', isNew: false, priceAA: 74000, priceAAA: 138000, reviews: 5, reviewCount: 389, accentColor: '#C8A060', notes: 'Lavanda · Naranja · Vainilla', colorBg: '#140A00', colorText: '#D4B070', stock: 35 },
  { house: 'Vallum', name: 'Bella Vida',    inspiredBy: 'La Vie Est Belle · Lancôme', gender: 'mujer', isNew: false, priceAA: 68000, priceAAA: 125000, reviews: 5, reviewCount: 412, accentColor: '#C0809A', notes: 'Iris · Praliné · Pachulí', colorBg: '#1A0010', colorText: '#D090B0', stock: 50 },
];

// Crea el esquema y siembra (idempotente). ready() garantiza que solo corra una vez.
let readyPromise = null;
async function migrateAndSeed() {
  await pool.query(SCHEMA);

  const u = await pool.query('SELECT COUNT(*)::int AS c FROM users');
  if (u.rows[0].c === 0) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await pool.query('INSERT INTO users (email, "passwordHash", role) VALUES ($1, $2, $3)', [ADMIN_EMAIL.toLowerCase(), hash, 'admin']);
    console.log('[db] Admin inicial creado:', ADMIN_EMAIL);
  }

  const p = await pool.query('SELECT COUNT(*)::int AS c FROM products');
  if (p.rows[0].c === 0) {
    for (const s of SEED) {
      await pool.query(
        `INSERT INTO products (house, name, "inspiredBy", gender, "isNew", "priceAA", "priceAAA", reviews, "reviewCount", "accentColor", notes, "colorBg", "colorText", stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [s.house, s.name, s.inspiredBy, s.gender, s.isNew, s.priceAA, s.priceAAA, s.reviews, s.reviewCount, s.accentColor, s.notes, s.colorBg, s.colorText, s.stock]
      );
    }
    console.log('[db] Sembrados', SEED.length, 'productos iniciales.');
  }
}

export function ready() {
  if (!readyPromise) readyPromise = migrateAndSeed();
  return readyPromise;
}
