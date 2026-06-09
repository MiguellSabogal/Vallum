import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// La ruta de la BD es configurable (DB_PATH). En tests usamos ':memory:' para
// una base aislada y efímera. Por defecto, el archivo de siempre.
const dbPath = process.env.DB_PATH || join(__dirname, 'vallum.db');
const db = new Database(dbPath);
if (dbPath !== ':memory:') db.pragma('journal_mode = WAL'); // WAL no aplica en memoria
db.pragma('foreign_keys = ON'); // respeta las relaciones entre tablas

// ── TABLA USERS (autenticación) ───────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT    NOT NULL UNIQUE,
    passwordHash TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'admin',
    createdAt    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Siembra del admin inicial (solo si no hay ningún usuario).
// La contraseña se guarda HASHEADA con bcrypt, nunca en texto plano.
const { uc } = db.prepare('SELECT COUNT(*) AS uc FROM users').get();
if (uc === 0) {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10); // 10 = factor de coste
  db.prepare('INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)')
    .run(ADMIN_EMAIL.toLowerCase(), passwordHash, 'admin');
  console.log(`[db] Admin inicial creado: ${ADMIN_EMAIL}`);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    house       TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    inspiredBy  TEXT    NOT NULL DEFAULT '',
    gender      TEXT    NOT NULL DEFAULT 'unisex',
    isNew       INTEGER NOT NULL DEFAULT 0,
    priceAA     INTEGER NOT NULL DEFAULT 0,
    priceAAA    INTEGER NOT NULL DEFAULT 0,
    reviews     INTEGER NOT NULL DEFAULT 5,
    reviewCount INTEGER NOT NULL DEFAULT 0,
    accentColor TEXT    NOT NULL DEFAULT '#D4AF37',
    notes       TEXT    NOT NULL DEFAULT '',
    colorBg     TEXT    NOT NULL DEFAULT '#1A1A1A',
    colorText   TEXT    NOT NULL DEFAULT '#D4AF37',
    imageUrl    TEXT    NOT NULL DEFAULT '',
    stock       INTEGER NOT NULL DEFAULT 0
  );
`);

// ── TABLAS DE PEDIDOS ─────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reference     TEXT    NOT NULL UNIQUE,
    customerName  TEXT    NOT NULL,
    customerEmail TEXT    NOT NULL,
    customerPhone TEXT    NOT NULL,
    address       TEXT    NOT NULL,
    city          TEXT    NOT NULL,
    notes         TEXT    NOT NULL DEFAULT '',
    status        TEXT    NOT NULL DEFAULT 'pendiente',
    paymentStatus TEXT    NOT NULL DEFAULT 'pendiente',
    paymentId     TEXT    NOT NULL DEFAULT '',
    paymentMethod TEXT    NOT NULL DEFAULT '',
    total         INTEGER NOT NULL,
    createdAt     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId     INTEGER NOT NULL,
    productId   INTEGER,
    productName TEXT    NOT NULL,
    quality     TEXT    NOT NULL,
    unitPrice   INTEGER NOT NULL,
    qty         INTEGER NOT NULL,
    lineTotal   INTEGER NOT NULL,
    FOREIGN KEY (orderId)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);

  -- Registro de eventos de webhook ya procesados (idempotencia)
  CREATE TABLE IF NOT EXISTS webhook_events (
    eventId    TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    receivedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── MIGRACIÓN LIGERA ──────────────────────────────────
// CREATE TABLE IF NOT EXISTS no añade columnas a tablas que ya existen.
// Este helper añade una columna solo si falta (idempotente), para que el
// esquema pueda evolucionar sin borrar la base de datos a mano.
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[db] Migración: columna ${table}.${column} añadida`);
  }
}
ensureColumn('products', 'imageUrl', "TEXT NOT NULL DEFAULT ''");
ensureColumn('products', 'inspiredBy', "TEXT NOT NULL DEFAULT ''");
// Backfill de stock=100 a productos ya existentes (los nuevos lo traen en la semilla)
ensureColumn('products', 'stock', 'INTEGER NOT NULL DEFAULT 100');
// Campos de pago en pedidos ya existentes
ensureColumn('orders', 'paymentStatus', "TEXT NOT NULL DEFAULT 'pendiente'");
ensureColumn('orders', 'paymentId', "TEXT NOT NULL DEFAULT ''");
ensureColumn('orders', 'paymentMethod', "TEXT NOT NULL DEFAULT ''");

// Semilla: catálogo propio de Vallum. Cada perfume tiene nombre propio y referencia
// la fragancia que lo inspira (posicionamiento "inspirado en", no réplica de marca).
const SEED = [
  { house: 'Vallum', name: 'Rouge 540',   inspiredBy: 'Baccarat Rouge 540 · Maison Francis Kurkdjian', gender: 'unisex', isNew: 1, priceAA: 80000, priceAAA: 150000, reviews: 5, reviewCount: 487, accentColor: '#D4AF37', notes: 'Jazmín · Safran · Cedro', colorBg: '#1A1A1A', colorText: '#D4AF37', stock: 120 },
  { house: 'Vallum', name: 'Triunfo',     inspiredBy: 'Aventus · Creed', gender: 'hombre', isNew: 0, priceAA: 75000, priceAAA: 140000, reviews: 5, reviewCount: 362, accentColor: '#C0C0C0', notes: 'Piña · Abedul · Musgo', colorBg: '#0D0D0D', colorText: '#AFAFAF', stock: 80 },
  { house: 'Vallum', name: 'Orquídea Noir', inspiredBy: 'Black Orchid · Tom Ford', gender: 'unisex', isNew: 0, priceAA: 78000, priceAAA: 145000, reviews: 5, reviewCount: 298, accentColor: '#7B4F7A', notes: 'Orquídea · Trufa · Patchouli', colorBg: '#200020', colorText: '#A070A0', stock: 40 },
  { house: 'Vallum', name: 'Oud Real',    inspiredBy: 'Oud Wood · Tom Ford', gender: 'unisex', isNew: 0, priceAA: 82000, priceAAA: 155000, reviews: 5, reviewCount: 201, accentColor: '#8B6914', notes: 'Oud · Sándalo · Ámbar', colorBg: '#1A0F00', colorText: '#B58A28', stock: 5 },
  { house: 'Vallum', name: 'Azur',        inspiredBy: 'Bleu de Chanel · Chanel', gender: 'hombre', isNew: 0, priceAA: 72000, priceAAA: 135000, reviews: 5, reviewCount: 543, accentColor: '#4A6D8A', notes: 'Toronja · Cedro · Incienso', colorBg: '#0A1520', colorText: '#6A9DC0', stock: 60 },
  { house: 'Vallum', name: 'Indómito',    inspiredBy: 'Sauvage · Dior', gender: 'hombre', isNew: 1, priceAA: 70000, priceAAA: 130000, reviews: 5, reviewCount: 621, accentColor: '#7AA0B0', notes: 'Bergamota · Pimienta · Ambroxan', colorBg: '#050F1A', colorText: '#8AB4C8', stock: 100 },
  { house: 'Vallum', name: 'Libertad',    inspiredBy: 'Libre · Yves Saint Laurent', gender: 'mujer', isNew: 0, priceAA: 74000, priceAAA: 138000, reviews: 5, reviewCount: 389, accentColor: '#C8A060', notes: 'Lavanda · Naranja · Vainilla', colorBg: '#140A00', colorText: '#D4B070', stock: 35 },
  { house: 'Vallum', name: 'Bella Vida',  inspiredBy: 'La Vie Est Belle · Lancôme', gender: 'mujer', isNew: 0, priceAA: 68000, priceAAA: 125000, reviews: 5, reviewCount: 412, accentColor: '#C0809A', notes: 'Iris · Praliné · Pachulí', colorBg: '#1A0010', colorText: '#D090B0', stock: 50 },
];

const { c } = db.prepare('SELECT COUNT(*) AS c FROM products').get();
if (c === 0) {
  const insert = db.prepare(`
    INSERT INTO products
      (house, name, inspiredBy, gender, isNew, priceAA, priceAAA, reviews, reviewCount, accentColor, notes, colorBg, colorText, stock)
    VALUES
      (@house, @name, @inspiredBy, @gender, @isNew, @priceAA, @priceAAA, @reviews, @reviewCount, @accentColor, @notes, @colorBg, @colorText, @stock)
  `);
  const seedAll = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
  seedAll(SEED);
  console.log(`[db] Sembrados ${SEED.length} productos iniciales.`);
}

export default db;
