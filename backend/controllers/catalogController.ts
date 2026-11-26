import type { Response } from 'express';
import { db, runTransaction } from '../db/database.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import {
  isNonEmptyString,
  parseNonNegativeNumber,
  sanitizeOptionalString,
} from '../utils/validation.ts';

export function listCategories(_req: AuthRequest, res: Response): void {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.description, c.created_at AS createdAt,
              COUNT(i.id) AS itemCount
       FROM categories c
       LEFT JOIN items i ON i.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    )
    .all();

  res.json({ categories: rows });
}

export function createCategory(req: AuthRequest, res: Response): void {
  const { name, description } = req.body ?? {};
  if (!isNonEmptyString(name, 100)) {
    res.status(400).json({ error: 'Category name is required (max 100 characters).' });
    return;
  }

  const trimmedName = name.trim();
  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(trimmedName);
  if (existing) {
    res.status(409).json({ error: 'A category with this name already exists.' });
    return;
  }

  const info = db
    .prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
    .run(trimmedName, sanitizeOptionalString(description, 255));

  const created = db
    .prepare(
      `SELECT id, name, description, created_at AS createdAt, 0 AS itemCount
       FROM categories WHERE id = ?`
    )
    .get(Number(info.lastInsertRowid));

  res.status(201).json({ category: created });
}

export function updateCategory(req: AuthRequest, res: Response): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid category ID.' });
    return;
  }

  const { name, description } = req.body ?? {};
  if (!isNonEmptyString(name, 100)) {
    res.status(400).json({ error: 'Category name is required (max 100 characters).' });
    return;
  }

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT id FROM categories WHERE name = ? AND id != ?')
    .get(name.trim(), id);
  if (duplicate) {
    res.status(409).json({ error: 'Another category already uses this name.' });
    return;
  }

  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(
    name.trim(),
    sanitizeOptionalString(description, 255),
    id
  );

  const updated = db
    .prepare(
      `SELECT c.id, c.name, c.description, c.created_at AS createdAt, COUNT(i.id) AS itemCount
       FROM categories c
       LEFT JOIN items i ON i.category_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`
    )
    .get(id);

  res.json({ category: updated });
}

export function listItems(_req: AuthRequest, res: Response): void {
  const rows = db
    .prepare(
      `SELECT i.id, i.name, i.category_id AS categoryId, c.name AS categoryName,
              i.unit, i.min_threshold AS minThreshold, i.created_at AS createdAt,
              COALESCE(inv.total_received, 0) AS totalReceived,
              COALESCE(inv.total_distributed, 0) AS totalDistributed,
              COALESCE(inv.current_stock, 0) AS currentStock
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       ORDER BY i.name ASC`
    )
    .all();

  res.json({ items: rows });
}

export function createItem(req: AuthRequest, res: Response): void {
  const { name, categoryId, unit, minThreshold } = req.body ?? {};
  if (!isNonEmptyString(name, 150)) {
    res.status(400).json({ error: 'Item name is required (max 150 characters).' });
    return;
  }
  const catId = Number(categoryId);
  if (!Number.isInteger(catId) || catId <= 0) {
    res.status(400).json({ error: 'Please select a valid category.' });
    return;
  }
  if (!isNonEmptyString(unit, 40)) {
    res.status(400).json({ error: 'Unit is required (e.g., kg, pieces, kits, boxes).' });
    return;
  }

  const parsedThreshold =
    minThreshold === undefined || minThreshold === '' ? 10 : parseNonNegativeNumber(minThreshold);
  if (parsedThreshold === null) {
    res.status(400).json({ error: 'Minimum stock threshold must be 0 or greater.' });
    return;
  }

  const catExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(catId);
  if (!catExists) {
    res.status(404).json({ error: 'Selected category does not exist.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT id FROM items WHERE lower(name) = lower(?) AND category_id = ?')
    .get(name.trim(), catId);
  if (duplicate) {
    res.status(409).json({ error: 'An item with this name already exists in the selected category.' });
    return;
  }

  const itemId = runTransaction(() => {
    const info = db
      .prepare('INSERT INTO items (name, category_id, unit, min_threshold) VALUES (?, ?, ?, ?)')
      .run(name.trim(), catId, unit.trim(), parsedThreshold);
    const newId = Number(info.lastInsertRowid);
    db.prepare(
      'INSERT INTO inventory (item_id, total_received, total_distributed, current_stock) VALUES (?, 0, 0, 0)'
    ).run(newId);
    return newId;
  });

  const created = db
    .prepare(
      `SELECT i.id, i.name, i.category_id AS categoryId, c.name AS categoryName,
              i.unit, i.min_threshold AS minThreshold, i.created_at AS createdAt,
              COALESCE(inv.total_received, 0) AS totalReceived,
              COALESCE(inv.total_distributed, 0) AS totalDistributed,
              COALESCE(inv.current_stock, 0) AS currentStock
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       WHERE i.id = ?`
    )
    .get(itemId);

  res.status(201).json({ item: created });
}

export function updateItem(req: AuthRequest, res: Response): void {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid item ID.' });
    return;
  }

  const { name, categoryId, unit, minThreshold } = req.body ?? {};
  if (!isNonEmptyString(name, 150)) {
    res.status(400).json({ error: 'Item name is required.' });
    return;
  }
  const catId = Number(categoryId);
  if (!Number.isInteger(catId) || catId <= 0) {
    res.status(400).json({ error: 'Please select a valid category.' });
    return;
  }
  if (!isNonEmptyString(unit, 40)) {
    res.status(400).json({ error: 'Unit is required.' });
    return;
  }
  const parsedThreshold = parseNonNegativeNumber(minThreshold);
  if (parsedThreshold === null) {
    res.status(400).json({ error: 'Minimum stock threshold must be 0 or greater.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM items WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  const catExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(catId);
  if (!catExists) {
    res.status(404).json({ error: 'Selected category does not exist.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT id FROM items WHERE lower(name) = lower(?) AND category_id = ? AND id != ?')
    .get(name.trim(), catId, id);
  if (duplicate) {
    res.status(409).json({ error: 'Another item with this name already exists in this category.' });
    return;
  }

  db.prepare(
    'UPDATE items SET name = ?, category_id = ?, unit = ?, min_threshold = ? WHERE id = ?'
  ).run(name.trim(), catId, unit.trim(), parsedThreshold, id);

  const updated = db
    .prepare(
      `SELECT i.id, i.name, i.category_id AS categoryId, c.name AS categoryName,
              i.unit, i.min_threshold AS minThreshold, i.created_at AS createdAt,
              COALESCE(inv.total_received, 0) AS totalReceived,
              COALESCE(inv.total_distributed, 0) AS totalDistributed,
              COALESCE(inv.current_stock, 0) AS currentStock
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       WHERE i.id = ?`
    )
    .get(id);

  res.json({ item: updated });
}

export function listDonors(_req: AuthRequest, res: Response): void {
  const rows = db
    .prepare(
      `SELECT d.id, d.name, d.contact_info AS contactInfo, d.created_at AS createdAt,
              COUNT(dn.id) AS donationCount
       FROM donors d
       LEFT JOIN donations dn ON dn.donor_id = d.id
       GROUP BY d.id
       ORDER BY d.name ASC`
    )
    .all();

  res.json({ donors: rows });
}
