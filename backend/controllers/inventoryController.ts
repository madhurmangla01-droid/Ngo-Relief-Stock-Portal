import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { parseNonNegativeNumber } from '../utils/validation.ts';

export interface InventoryRecord {
  itemId: number;
  itemName: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  minThreshold: number;
  totalReceived: number;
  totalDistributed: number;
  currentStock: number;
  updatedAt: string;
  stockStatus: 'out' | 'low' | 'healthy';
}

export function listInventory(req: AuthRequest, res: Response): void {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'all';

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (search) {
    clauses.push('(lower(i.name) LIKE ? OR lower(c.name) LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
    clauses.push('i.category_id = ?');
    params.push(categoryId);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT i.id AS itemId, i.name AS itemName, i.category_id AS categoryId,
              c.name AS categoryName, i.unit, i.min_threshold AS minThreshold,
              COALESCE(inv.total_received, 0) AS totalReceived,
              COALESCE(inv.total_distributed, 0) AS totalDistributed,
              COALESCE(inv.current_stock, 0) AS currentStock,
              COALESCE(inv.updated_at, i.created_at) AS updatedAt
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       ${whereSql}
       ORDER BY (CASE WHEN COALESCE(inv.current_stock, 0) <= 0 THEN 0
                      WHEN COALESCE(inv.current_stock, 0) < i.min_threshold THEN 1
                      ELSE 2 END) ASC,
                i.name ASC`
    )
    .all(...params) as Array<Omit<InventoryRecord, 'stockStatus'>>;

  const enriched: InventoryRecord[] = rows.map((r) => ({
    ...r,
    stockStatus:
      r.currentStock <= 0 ? 'out' : r.currentStock < r.minThreshold ? 'low' : 'healthy',
  }));

  const filtered =
    statusFilter === 'low'
      ? enriched.filter((r) => r.stockStatus === 'low' || r.stockStatus === 'out')
      : statusFilter === 'out'
        ? enriched.filter((r) => r.stockStatus === 'out')
        : statusFilter === 'healthy'
          ? enriched.filter((r) => r.stockStatus === 'healthy')
          : enriched;

  res.json({ inventory: filtered });
}

export function updateItemThreshold(req: AuthRequest, res: Response): void {
  const itemId = Number(req.params.itemId);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    res.status(400).json({ error: 'Invalid item ID.' });
    return;
  }

  const parsedThreshold = parseNonNegativeNumber(req.body?.minThreshold);
  if (parsedThreshold === null) {
    res.status(400).json({ error: 'Minimum stock threshold must be a number of 0 or more.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM items WHERE id = ?').get(itemId);
  if (!existing) {
    res.status(404).json({ error: 'Item not found.' });
    return;
  }

  db.prepare('UPDATE items SET min_threshold = ? WHERE id = ?').run(parsedThreshold, itemId);

  const updated = db
    .prepare(
      `SELECT i.id AS itemId, i.name AS itemName, i.category_id AS categoryId,
              c.name AS categoryName, i.unit, i.min_threshold AS minThreshold,
              COALESCE(inv.total_received, 0) AS totalReceived,
              COALESCE(inv.total_distributed, 0) AS totalDistributed,
              COALESCE(inv.current_stock, 0) AS currentStock,
              COALESCE(inv.updated_at, i.created_at) AS updatedAt
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       WHERE i.id = ?`
    )
    .get(itemId) as Omit<InventoryRecord, 'stockStatus'>;

  const stockStatus: InventoryRecord['stockStatus'] =
    updated.currentStock <= 0
      ? 'out'
      : updated.currentStock < updated.minThreshold
        ? 'low'
        : 'healthy';

  res.json({ item: { ...updated, stockStatus } });
}
