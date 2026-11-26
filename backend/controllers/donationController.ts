import type { Response } from 'express';
import { db, runTransaction } from '../db/database.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import {
  isNonEmptyString,
  isValidDateString,
  parsePositiveNumber,
  sanitizeOptionalString,
} from '../utils/validation.ts';

export function listDonations(req: AuthRequest, res: Response): void {
  const item = typeof req.query.item === 'string' ? req.query.item.trim().toLowerCase() : '';
  const donor = typeof req.query.donor === 'string' ? req.query.donor.trim().toLowerCase() : '';
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom.trim() : '';
  const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo.trim() : '';

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (item) {
    clauses.push('lower(i.name) LIKE ?');
    params.push(`%${item}%`);
  }
  if (donor) {
    clauses.push('lower(d.name) LIKE ?');
    params.push(`%${donor}%`);
  }
  if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
    clauses.push('i.category_id = ?');
    params.push(categoryId);
  }
  if (dateFrom && isValidDateString(dateFrom)) {
    clauses.push('dn.donation_date >= ?');
    params.push(dateFrom);
  }
  if (dateTo && isValidDateString(dateTo)) {
    clauses.push('dn.donation_date <= ?');
    params.push(dateTo);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT dn.id, dn.donor_id AS donorId, d.name AS donorName, d.contact_info AS donorContact,
              dn.item_id AS itemId, i.name AS itemName,
              i.category_id AS categoryId, c.name AS categoryName,
              dn.quantity, dn.unit, dn.donation_date AS donationDate,
              dn.notes, dn.created_at AS createdAt,
              COALESCE(u.display_name, 'System Seed') AS recordedBy
       FROM donations dn
       JOIN donors d ON d.id = dn.donor_id
       JOIN items i ON i.id = dn.item_id
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN users u ON u.id = dn.recorded_by
       ${whereSql}
       ORDER BY dn.donation_date DESC, dn.id DESC`
    )
    .all(...params);

  res.json({ donations: rows });
}

export function createDonation(req: AuthRequest, res: Response): void {
  const {
    donorName,
    donorContact,
    itemId,
    itemName,
    categoryId,
    quantity,
    unit,
    donationDate,
    notes,
  } = req.body ?? {};

  if (!isNonEmptyString(donorName, 150)) {
    res.status(400).json({ error: 'Donor name is required.' });
    return;
  }

  const parsedQty = parsePositiveNumber(quantity);
  if (parsedQty === null) {
    res.status(400).json({ error: 'Quantity must be a positive number greater than 0.' });
    return;
  }

  if (!isValidDateString(donationDate)) {
    res.status(400).json({ error: 'Please provide a valid donation date (YYYY-MM-DD).' });
    return;
  }

  const cleanDonorName = donorName.trim();
  const cleanDonorContact = sanitizeOptionalString(donorContact, 180);
  const cleanNotes = sanitizeOptionalString(notes, 1000);

  let resolvedItemId: number;
  let resolvedUnit: string;

  if (itemId !== undefined && itemId !== null && itemId !== '' && itemId !== 'new') {
    const parsedItemId = Number(itemId);
    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      res.status(400).json({ error: 'Selected item is invalid.' });
      return;
    }
    const itemRow = db
      .prepare('SELECT id, unit FROM items WHERE id = ?')
      .get(parsedItemId) as { id: number; unit: string } | undefined;
    if (!itemRow) {
      res.status(404).json({ error: 'Selected item was not found.' });
      return;
    }
    resolvedItemId = itemRow.id;
    resolvedUnit = isNonEmptyString(unit, 40) ? unit.trim() : itemRow.unit;
  } else {
    // Support creating a brand-new item inline during goods-in
    if (!isNonEmptyString(itemName, 150)) {
      res.status(400).json({ error: 'Please select an existing item or enter a new item name.' });
      return;
    }
    const parsedCatId = Number(categoryId);
    if (!Number.isInteger(parsedCatId) || parsedCatId <= 0) {
      res.status(400).json({ error: 'Please select a valid category for the item.' });
      return;
    }
    if (!isNonEmptyString(unit, 40)) {
      res.status(400).json({ error: 'Unit is required (e.g., kg, pieces, kits).' });
      return;
    }
    const catExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(parsedCatId);
    if (!catExists) {
      res.status(404).json({ error: 'Selected category does not exist.' });
      return;
    }

    const existingItem = db
      .prepare('SELECT id, unit FROM items WHERE lower(name) = lower(?) AND category_id = ?')
      .get(itemName.trim(), parsedCatId) as { id: number; unit: string } | undefined;

    if (existingItem) {
      resolvedItemId = existingItem.id;
      resolvedUnit = unit.trim();
    } else {
      resolvedItemId = -1; // Will be created inside transaction below
      resolvedUnit = unit.trim();
    }
  }

  const donationId = runTransaction(() => {
    let finalItemId = resolvedItemId;
    if (finalItemId === -1) {
      const itemInfo = db
        .prepare('INSERT INTO items (name, category_id, unit, min_threshold) VALUES (?, ?, ?, 10)')
        .run(itemName.trim(), Number(categoryId), resolvedUnit);
      finalItemId = Number(itemInfo.lastInsertRowid);
      db.prepare(
        'INSERT INTO inventory (item_id, total_received, total_distributed, current_stock) VALUES (?, 0, 0, 0)'
      ).run(finalItemId);
    }

    // Find or create donor
    let donorRow = db
      .prepare('SELECT id FROM donors WHERE lower(name) = lower(?)')
      .get(cleanDonorName) as { id: number } | undefined;

    if (!donorRow) {
      const donorInfo = db
        .prepare('INSERT INTO donors (name, contact_info) VALUES (?, ?)')
        .run(cleanDonorName, cleanDonorContact);
      donorRow = { id: Number(donorInfo.lastInsertRowid) };
    } else if (cleanDonorContact) {
      db.prepare('UPDATE donors SET contact_info = ? WHERE id = ?').run(
        cleanDonorContact,
        donorRow.id
      );
    }

    // Insert donation (goods-in)
    const donationInfo = db
      .prepare(
        `INSERT INTO donations (donor_id, item_id, quantity, unit, donation_date, notes, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        donorRow.id,
        finalItemId,
        parsedQty,
        resolvedUnit,
        donationDate.trim(),
        cleanNotes,
        req.user?.id ?? null
      );

    // Ensure inventory row exists and increment stock
    const invRow = db.prepare('SELECT id FROM inventory WHERE item_id = ?').get(finalItemId);
    if (!invRow) {
      db.prepare(
        `INSERT INTO inventory (item_id, total_received, total_distributed, current_stock)
         VALUES (?, ?, 0, ?)`
      ).run(finalItemId, parsedQty, parsedQty);
    } else {
      db.prepare(
        `UPDATE inventory
         SET total_received = total_received + ?,
             current_stock = current_stock + ?,
             updated_at = datetime('now')
         WHERE item_id = ?`
      ).run(parsedQty, parsedQty, finalItemId);
    }

    return Number(donationInfo.lastInsertRowid);
  });

  const created = db
    .prepare(
      `SELECT dn.id, dn.donor_id AS donorId, d.name AS donorName, d.contact_info AS donorContact,
              dn.item_id AS itemId, i.name AS itemName,
              i.category_id AS categoryId, c.name AS categoryName,
              dn.quantity, dn.unit, dn.donation_date AS donationDate,
              dn.notes, dn.created_at AS createdAt,
              COALESCE(u.display_name, 'System Seed') AS recordedBy,
              inv.current_stock AS updatedStock
       FROM donations dn
       JOIN donors d ON d.id = dn.donor_id
       JOIN items i ON i.id = dn.item_id
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN users u ON u.id = dn.recorded_by
       LEFT JOIN inventory inv ON inv.item_id = dn.item_id
       WHERE dn.id = ?`
    )
    .get(donationId);

  res.status(201).json({ donation: created });
}
