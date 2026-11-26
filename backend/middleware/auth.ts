import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.ts';
import { verifySessionToken } from '../utils/crypto.ts';

export interface NgoDetails {
  id: number;
  name: string;
  registrationNumber: string;
  cityState: string;
  focusArea: string;
  officialPhone: string;
}

export interface AuthenticatedUser {
  id: number;
  ngoId: number;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  ngo: NgoDetails;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

interface JoinedUserRow {
  id: number;
  ngoId: number;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  ngoName: string;
  ngoRegistrationNumber: string;
  ngoCityState: string;
  ngoFocusArea: string;
  ngoOfficialPhone: string;
  ngoIsAuthorized: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorized NGO authentication required. Please sign in.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Your session is invalid or has expired. Please sign in again.' });
    return;
  }

  const row = db
    .prepare(
      `SELECT u.id, u.ngo_id AS ngoId, u.display_name AS displayName, u.email, u.role,
              u.avatar_url AS avatarUrl, u.created_at AS createdAt,
              n.name AS ngoName, n.registration_number AS ngoRegistrationNumber,
              n.city_state AS ngoCityState, n.focus_area AS ngoFocusArea,
              n.official_phone AS ngoOfficialPhone, n.is_authorized AS ngoIsAuthorized
       FROM users u
       JOIN ngos n ON n.id = u.ngo_id
       WHERE u.id = ? AND u.ngo_id = ?`
    )
    .get(payload.userId, payload.ngoId) as unknown as JoinedUserRow | undefined;

  if (!row || row.ngoIsAuthorized !== 1) {
    res.status(403).json({
      error: 'Access restricted to authorized NGOs. Please register your NGO or sign in with verified credentials.',
    });
    return;
  }

  req.user = {
    id: row.id,
    ngoId: row.ngoId,
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
    ngo: {
      id: row.ngoId,
      name: row.ngoName,
      registrationNumber: row.ngoRegistrationNumber,
      cityState: row.ngoCityState,
      focusArea: row.ngoFocusArea,
      officialPhone: row.ngoOfficialPhone,
    },
  };

  next();
}
