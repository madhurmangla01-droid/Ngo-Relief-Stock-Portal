
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_DIR = path.resolve(process.cwd(), 'backend', 'db');
const DB_PATH = path.join(DB_DIR, 'ngo_inventory.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable foreign key integrity and WAL mode
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function runTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function ensureUsersNgoColumn(): void {
  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  const hasNgoId = columns.some((c) => c.name === 'ngo_id');
  if (!hasNgoId) {
    db.exec('ALTER TABLE users ADD COLUMN ngo_id INTEGER REFERENCES ngos(id) ON DELETE RESTRICT;');
  }
}

function createImmutabilityTriggers(): void {
  const tables = [
    'ngos',
    'users',
    'donors',
    'categories',
    'items',
    'inventory',
    'donations',
    'distributions',
  ];

  for (const table of tables) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS prevent_delete_${table}
      BEFORE DELETE ON ${table}
      BEGIN
        SELECT RAISE(ABORT, 'Deletion is disabled: NGO records and transactions are permanent.');
      END;
    `);
  }
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ngos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE COLLATE NOCASE,
      city_state TEXT NOT NULL,
      focus_area TEXT NOT NULL DEFAULT 'Community Relief',
      official_phone TEXT NOT NULL,
      is_authorized INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngo_id INTEGER REFERENCES ngos(id) ON DELETE RESTRICT,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Authorized Coordinator',
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS donors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      contact_info TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'units',
      min_threshold REAL NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name, category_id),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL UNIQUE,
      total_received REAL NOT NULL DEFAULT 0,
      total_distributed REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity REAL NOT NULL CHECK (quantity > 0),
      unit TEXT NOT NULL,
      donation_date TEXT NOT NULL,
      notes TEXT,
      recorded_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE RESTRICT,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      quantity REAL NOT NULL CHECK (quantity > 0),
      unit TEXT NOT NULL,
      beneficiary_location TEXT NOT NULL,
      distribution_date TEXT NOT NULL,
      notes TEXT,
      recorded_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date DESC);
    CREATE INDEX IF NOT EXISTS idx_distributions_date ON distributions(distribution_date DESC);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
  `);

  ensureUsersNgoColumn();
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_ngo ON users(ngo_id);');
  createImmutabilityTriggers();
  seedSampleDataIfEmpty();
}

function seedSampleDataIfEmpty(): void {
  const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number };
  if (categoryCount.count > 0) {
    return;
  }

  runTransaction(() => {
    const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const categories = [
      ['Food & Grains', 'Staple grains, pulses, cooking oil, and dry food rations'],
      ['Clothing & Blankets', 'Warm blankets, seasonal garments, and winter essentials'],
      ['Medicines & First Aid', 'OTC medicines, bandages, ORS packets, and first-aid kits'],
      ['Books & Education', 'School notebooks, textbooks, and classroom stationery sets'],
      ['Hygiene & Sanitation', 'Soap bars, sanitary kits, and clean drinking water supplies'],
    ];
    const catIds: number[] = [];
    for (const [name, desc] of categories) {
      const info = insertCategory.run(name, desc);
      catIds.push(Number(info.lastInsertRowid));
    }

    const insertDonor = db.prepare('INSERT INTO donors (name, contact_info) VALUES (?, ?)');
    const donors = [
      ['Sunrise Community Foundation', 'contact@sunrisefoundation.org'],
      ['Ananya Sharma & Family', 'ananya.sharma@example.org'],
      ['Metro Pharmacy Collective', 'donations@metropharmacy.org'],
      ['Greenfield Rotary Club', 'service@greenfieldrotary.org'],
      ['City Book Trust', 'outreach@citybooktrust.org'],
    ];
    const donorIds: number[] = [];
    for (const [name, contact] of donors) {
      const info = insertDonor.run(name, contact);
      donorIds.push(Number(info.lastInsertRowid));
    }

    const insertItem = db.prepare(
      'INSERT INTO items (name, category_id, unit, min_threshold) VALUES (?, ?, ?, ?)'
    );
    const insertInventory = db.prepare(
      'INSERT INTO inventory (item_id, total_received, total_distributed, current_stock) VALUES (?, 0, 0, 0)'
    );

    const itemsData: Array<[string, number, string, number]> = [
      ['Basmati Rice Bags', catIds[0], 'kg', 100],
      ['Lentil & Dal Packs', catIds[0], 'kg', 60],
      ['Woolen Blankets', catIds[1], 'pieces', 40],
      ['Children Winter Jackets', catIds[1], 'pieces', 25],
      ['First-Aid Medical Kits', catIds[2], 'kits', 20],
      ['Oral Rehydration Salts (ORS)', catIds[2], 'boxes', 30],
      ['School Notebook Bundles', catIds[3], 'packs', 50],
      ['Primary Science Textbooks', catIds[3], 'copies', 30],
      ['Family Hygiene Kits', catIds[4], 'kits', 25],
    ];

    const itemIds: number[] = [];
    for (const [name, categoryId, unit, minThreshold] of itemsData) {
      const info = insertItem.run(name, categoryId, unit, minThreshold);
      const id = Number(info.lastInsertRowid);
      itemIds.push(id);
      insertInventory.run(id);
    }

    const insertDonation = db.prepare(
      `INSERT INTO donations (donor_id, item_id, quantity, unit, donation_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const addStock = db.prepare(
      `UPDATE inventory
       SET total_received = total_received + ?,
           current_stock = current_stock + ?,
           updated_at = datetime('now')
       WHERE item_id = ?`
    );

    const sampleDonations: Array<[number, number, number, string, string, string]> = [
      [donorIds[0], itemIds[0], 350, 'kg', '2026-11-05', 'Monthly staple grain drive delivery'],
      [donorIds[0], itemIds[1], 180, 'kg', '2026-11-08', 'Assorted red and yellow lentils'],
      [donorIds[3], itemIds[2], 120, 'pieces', '2026-11-10', 'Pre-winter shelter relief consignment'],
      [donorIds[1], itemIds[3], 45, 'pieces', '2026-11-12', 'New insulated jackets for ages 6–12'],
      [donorIds[2], itemIds[4], 50, 'kits', '2026-11-14', 'Standard 24-item bandage and trauma kits'],
      [donorIds[2], itemIds[5], 40, 'boxes', '2026-11-16', '50 sachets per box, long shelf life'],
      [donorIds[4], itemIds[6], 220, 'packs', '2026-11-18', 'Pack of 6 ruled notebooks each'],
      [donorIds[4], itemIds[7], 60, 'copies', '2026-11-20', 'Grade 4 to Grade 6 curriculum editions'],
      [donorIds[3], itemIds[8], 80, 'kits', '2026-11-21', 'Soap, toothpaste, towels, and sanitizer'],
    ];

    for (const [donorId, itemId, qty, unit, date, notes] of sampleDonations) {
      insertDonation.run(donorId, itemId, qty, unit, date, notes);
      addStock.run(qty, qty, itemId);
    }

    const insertDistribution = db.prepare(
      `INSERT INTO distributions (item_id, quantity, unit, beneficiary_location, distribution_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const deductStock = db.prepare(
      `UPDATE inventory
       SET total_distributed = total_distributed + ?,
           current_stock = current_stock - ?,
           updated_at = datetime('now')
       WHERE item_id = ?`
    );

    const sampleDistributions: Array<[number, number, string, string, string, string]> = [
      [itemIds[0], 140, 'kg', 'Eastward Community Kitchen', '2026-11-11', 'Weekly community meal prep allocation'],
      [itemIds[1], 135, 'kg', 'Riverfront Shelter Home', '2026-11-15', 'Dry ration packs for 45 families'],
      [itemIds[2], 92, 'pieces', 'North Station Night Shelter', '2026-11-17', 'Cold wave distribution drive'],
      [itemIds[3], 45, 'pieces', 'Hillside Youth Center', '2026-11-19', 'Complete batch issued to students'],
      [itemIds[4], 36, 'kits', 'Rural Mobile Health Camp — Zone B', '2026-11-21', 'Issued to volunteer nursing team'],
      [itemIds[5], 12, 'boxes', 'West Ward Primary Clinic', '2026-11-22', 'Pediatric ward replenishment'],
      [itemIds[6], 95, 'packs', 'Vidya Community Learning Center', '2026-11-23', 'Semester notebook distribution'],
      [itemIds[8], 42, 'kits', 'South Colony Relief Camp', '2026-11-24', 'Household sanitation kits'],
    ];

    for (const [itemId, qty, unit, location, date, notes] of sampleDistributions) {
      insertDistribution.run(itemId, qty, unit, location, date, notes);
      deductStock.run(qty, qty, itemId);
    }
  });
}
