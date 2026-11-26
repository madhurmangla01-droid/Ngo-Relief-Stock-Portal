import { Router } from 'express';
import {
  getAuthStatus,
  getMe,
  login,
  registerNgo,
  updateProfile,
} from '../controllers/authController.ts';
import {
  createCategory,
  createItem,
  listCategories,
  listDonors,
  listItems,
  updateCategory,
  updateItem,
} from '../controllers/catalogController.ts';
import { getDashboardOverview } from '../controllers/dashboardController.ts';
import { createDistribution, listDistributions } from '../controllers/distributionController.ts';
import { createDonation, listDonations } from '../controllers/donationController.ts';
import { listInventory, updateItemThreshold } from '../controllers/inventoryController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const apiRouter = Router();

// Public health & NGO authorization routes
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
apiRouter.get('/auth/status', getAuthStatus);
apiRouter.post('/auth/register-ngo', registerNgo);
apiRouter.post('/auth/login', login);

// Enforce strict no-delete policy across all API resources (permanent audit ledger)
apiRouter.delete('*', (_req, res) => {
  res.status(405).json({
    error: 'Deletion is disabled. All NGO inventory records and transaction histories are permanent.',
  });
});

// Authenticated routes (verified authorized NGO Bearer token required)
apiRouter.get('/auth/me', requireAuth, getMe);
apiRouter.put('/auth/profile', requireAuth, updateProfile);

apiRouter.get('/dashboard', requireAuth, getDashboardOverview);

apiRouter.get('/categories', requireAuth, listCategories);
apiRouter.post('/categories', requireAuth, createCategory);
apiRouter.put('/categories/:id', requireAuth, updateCategory);

apiRouter.get('/items', requireAuth, listItems);
apiRouter.post('/items', requireAuth, createItem);
apiRouter.put('/items/:id', requireAuth, updateItem);

apiRouter.get('/donors', requireAuth, listDonors);

apiRouter.get('/inventory', requireAuth, listInventory);
apiRouter.patch('/inventory/:itemId/threshold', requireAuth, updateItemThreshold);

apiRouter.get('/donations', requireAuth, listDonations);
apiRouter.post('/donations', requireAuth, createDonation);

apiRouter.get('/distributions', requireAuth, listDistributions);
apiRouter.post('/distributions', requireAuth, createDistribution);
