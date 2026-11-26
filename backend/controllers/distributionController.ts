import type { Response } from 'express';
import { db, runTransaction } from '../db/database.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import {
  isNonEmptyString,
  isValidDateString,
  parsePositiveNumber,
  sanitizeOptionalString,
} from '../utils/validation.ts';

export function listDistributions(req: AuthRequest, res: Response): void {
  const item = typeof req.query.item === 'string' ? req.query.item.trim().toLowerCase() : '';
  const beneficiary =
    typeof req.query.beneficiary === 'string' ? req.query.beneficiary.trim().toLowerCase() : '';
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom.trim() : '';
  const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo.trim() : '';

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (item) {
    clauses.push('lower(i.name) LIKE ?');
    params.push(`%${item}%`);
  }
  if (beneficiary) {
    clauses.push('lower(ds.beneficiary_location) LIKE ?');
    params.push(`%${beneficiary}%`);
  }
  if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
    clauses.push('i.category_id = ?');
    params.push(categoryId);
  }
  if (dateFrom && isValidDateString(dateFrom)) {
    clauses.push('ds.distribution_date >= ?');
    params.push(dateFrom);
  }
  if (dateTo && isValidDateString(dateTo)) {
    clauses.push('ds.distribution_date <= ?');
    params.push(dateTo);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT ds.id, ds.item_id AS itemId, i.name AS itemName,
              i.category_id AS categoryId, c.name AS categoryName,
              ds.quantity, ds.unit, ds.beneficiary_location AS beneficiaryLocation,
              ds.distribution_date AS distributionDate, ds.notes,
              ds.created_at AS createdAt,
              COALESCE(u.display_name, 'System Seed') AS recordedBy
       FROM distributions ds
       JOIN items i ON i.id = ds.item_id
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN users u ON u.id = ds.recorded_by
       ${whereSql}
       ORDER BY ds.distribution_date DESC, ds.id DESC`
    )
    .all(...params);

  res.json({ distributions: rows });
}

export function createDistribution(req: AuthRequest, res: Response): void {
  const { itemId, quantity, beneficiaryLocation, distributionDate, notes } = req.body ?? {};

  const parsedItemId = Number(itemId);
  if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
    res.status(400).json({ error: 'Please select a valid item to distribute.' });
    return;
  }

  const parsedQty = parsePositiveNumber(quantity);
  if (parsedQty === null) {
    res.status(400).json({ error: 'Distribution quantity must be a positive number greater than 0.' });
    return;
  }

  if (!isNonEmptyString(beneficiaryLocation, 200)) {
    res.status(400).json({ error: 'Beneficiary or distribution location is required.' });
    return;
  }

  if (!isValidDateString(distributionDate)) {
    res.status(400).json({ error: 'Please provide a valid distribution date (YYYY-MM-DD).' });
    return;
  }

  const cleanLocation = beneficiaryLocation.trim();
  const cleanNotes = sanitizeOptionalString(notes, 1000);

  try {
    const distributionId = runTransaction(() => {
      const itemStock = db
        .prepare(
          `SELECT i.id, i.name, i.unit, COALESCE(inv.current_stock, 0) AS currentStock
           FROM items i
           LEFT JOIN inventory inv ON inv.item_id = i.id
           WHERE i.id = ?`
        )
        .get(parsedItemId) as
        | { id: number; name: string; unit: string; currentStock: number }
        | undefined;

      if (!itemStock) {
        throw Object.assign(new Error('Selected item was not found.'), { statusCode: 404 });
      }

      if (parsedQty > itemStock.currentStock) {
        throw Object.assign(
          new Error(
            `Insufficient stock for ${itemStock.name}. Requested ${parsedQty} ${itemStock.unit}, but only ${itemStock.currentStock} ${itemStock.unit} currently available.`
          ),
          { statusCode: 400 }
        );
      }

      const distInfo = db
        .prepare(
          `INSERT INTO distributions (item_id, quantity, unit, beneficiary_location, distribution_date, notes, recorded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          parsedItemId,
          parsedQty,
          itemStock.unit,
          cleanLocation,
          distributionDate.trim(),
          cleanNotes,
          req.user?.id ?? null
        );

      db.prepare(
        `UPDATE inventory
         SET total_distributed = total_distributed + ?,
             current_stock = current_stock - ?,
             updated_at = datetime('now')
         WHERE item_id = ?`
      ).run(parsedQty, parsedQty, parsedItemId);

      return Number(distInfo.lastInsertRowid);
    });

    const created = db
      .prepare(
        `SELECT ds.id, ds.item_id AS itemId, i.name AS itemName,
                i.category_id AS categoryId, c.name AS categoryName,
                ds.quantity, ds.unit, ds.beneficiary_location AS beneficiaryLocation,
                ds.distribution_date AS distributionDate, ds.notes,
                ds.created_at AS createdAt,
                COALESCE(u.display_name, 'System Seed') AS recordedBy,
                inv.current_stock AS remainingStock
         FROM distributions ds
         JOIN items i ON i.id = ds.item_id
         JOIN categories c ON c.id = i.category_id
         LEFT JOIN users u ON u.id = ds.recorded_by
         LEFT JOIN inventory inv ON inv.item_id = ds.item_id
         WHERE ds.id = ?`
      )
      .get(distributionId);

    res.status(201).json({ distribution: created });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 400 || status === 404) {
      res.status(status).json({ error: (err as Error).message });
      return;
    }
    throw err;
  }
}
