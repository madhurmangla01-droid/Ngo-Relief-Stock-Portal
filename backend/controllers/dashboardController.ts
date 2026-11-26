import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthRequest } from '../middleware/auth.ts';

export function getDashboardOverview(_req: AuthRequest, res: Response): void {
  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(inv.total_received), 0) AS totalReceivedUnits,
         COALESCE(SUM(inv.total_distributed), 0) AS totalDistributedUnits,
         COALESCE(SUM(inv.current_stock), 0) AS currentAvailableStock,
         COUNT(i.id) AS totalItems,
         SUM(CASE WHEN COALESCE(inv.current_stock, 0) <= 0 THEN 1 ELSE 0 END) AS outOfStockCount,
         SUM(CASE WHEN COALESCE(inv.current_stock, 0) > 0 AND COALESCE(inv.current_stock, 0) < i.min_threshold THEN 1 ELSE 0 END) AS lowStockCount
       FROM items i
       LEFT JOIN inventory inv ON inv.item_id = i.id`
    )
    .get() as {
    totalReceivedUnits: number;
    totalDistributedUnits: number;
    currentAvailableStock: number;
    totalItems: number;
    outOfStockCount: number;
    lowStockCount: number;
  };

  const donationCount = (
    db.prepare('SELECT COUNT(*) AS count FROM donations').get() as { count: number }
  ).count;
  const distributionCount = (
    db.prepare('SELECT COUNT(*) AS count FROM distributions').get() as { count: number }
  ).count;
  const totalCategories = (
    db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number }
  ).count;
  const totalDonors = (
    db.prepare('SELECT COUNT(*) AS count FROM donors').get() as { count: number }
  ).count;

  const recentDonations = db
    .prepare(
      `SELECT dn.id, d.name AS donorName, i.name AS itemName, c.name AS categoryName,
              dn.quantity, dn.unit, dn.donation_date AS donationDate, dn.notes
       FROM donations dn
       JOIN donors d ON d.id = dn.donor_id
       JOIN items i ON i.id = dn.item_id
       JOIN categories c ON c.id = i.category_id
       ORDER BY dn.donation_date DESC, dn.id DESC
       LIMIT 5`
    )
    .all();

  const recentDistributions = db
    .prepare(
      `SELECT ds.id, i.name AS itemName, c.name AS categoryName,
              ds.quantity, ds.unit, ds.beneficiary_location AS beneficiaryLocation,
              ds.distribution_date AS distributionDate, ds.notes
       FROM distributions ds
       JOIN items i ON i.id = ds.item_id
       JOIN categories c ON c.id = i.category_id
       ORDER BY ds.distribution_date DESC, ds.id DESC
       LIMIT 5`
    )
    .all();

  const categoryOverview = db
    .prepare(
      `SELECT c.id AS categoryId, c.name AS categoryName,
              COUNT(i.id) AS itemCount,
              COALESCE(SUM(inv.total_received), 0) AS totalReceived,
              COALESCE(SUM(inv.total_distributed), 0) AS totalDistributed,
              COALESCE(SUM(inv.current_stock), 0) AS currentStock,
              SUM(CASE WHEN COALESCE(inv.current_stock, 0) < i.min_threshold THEN 1 ELSE 0 END) AS belowThresholdCount
       FROM categories c
       LEFT JOIN items i ON i.category_id = c.id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       GROUP BY c.id
       ORDER BY currentStock DESC, c.name ASC`
    )
    .all();

  const lowStockItems = db
    .prepare(
      `SELECT i.id AS itemId, i.name AS itemName, c.name AS categoryName,
              i.unit, i.min_threshold AS minThreshold,
              COALESCE(inv.current_stock, 0) AS currentStock,
              CASE WHEN COALESCE(inv.current_stock, 0) <= 0 THEN 'out' ELSE 'low' END AS stockStatus
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN inventory inv ON inv.item_id = i.id
       WHERE COALESCE(inv.current_stock, 0) < i.min_threshold
       ORDER BY COALESCE(inv.current_stock, 0) ASC, i.name ASC`
    )
    .all();

  res.json({
    summary: {
      totalReceivedUnits: totals.totalReceivedUnits ?? 0,
      totalDistributedUnits: totals.totalDistributedUnits ?? 0,
      currentAvailableStock: totals.currentAvailableStock ?? 0,
      totalItems: totals.totalItems ?? 0,
      outOfStockCount: totals.outOfStockCount ?? 0,
      lowStockCount: totals.lowStockCount ?? 0,
      alertsCount: (totals.outOfStockCount ?? 0) + (totals.lowStockCount ?? 0),
      donationCount,
      distributionCount,
      totalCategories,
      totalDonors,
    },
    recentDonations,
    recentDistributions,
    categoryOverview,
    lowStockItems,
  });
}
