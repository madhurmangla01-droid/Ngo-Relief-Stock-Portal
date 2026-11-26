import type { Response } from 'express';
import { db, runTransaction } from '../db/database.ts';
import type { AuthRequest, AuthenticatedUser } from '../middleware/auth.ts';
import { hashPassword, signSessionToken, verifyPassword } from '../utils/crypto.ts';
import { isNonEmptyString, isValidEmail, validateAvatarUrl } from '../utils/validation.ts';

const DEFAULT_AVATAR_URL = '/src/assets/images/avatar_ngo_coordinator_1795634517377.jpg';

interface JoinedUserWithHash {
  id: number;
  ngoId: number;
  displayName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  passwordHash: string;
  ngoName: string;
  ngoRegistrationNumber: string;
  ngoCityState: string;
  ngoFocusArea: string;
  ngoOfficialPhone: string;
  ngoIsAuthorized: number;
}

function fetchUserWithNgo(userId: number): AuthenticatedUser {
  const row = db
    .prepare(
      `SELECT u.id, u.ngo_id AS ngoId, u.display_name AS displayName, u.email, u.role,
              u.avatar_url AS avatarUrl, u.created_at AS createdAt,
              n.name AS ngoName, n.registration_number AS ngoRegistrationNumber,
              n.city_state AS ngoCityState, n.focus_area AS ngoFocusArea,
              n.official_phone AS ngoOfficialPhone
       FROM users u
       JOIN ngos n ON n.id = u.ngo_id
       WHERE u.id = ?`
    )
    .get(userId) as unknown as Omit<JoinedUserWithHash, 'passwordHash' | 'ngoIsAuthorized'>;

  return {
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
}

export function getAuthStatus(_req: AuthRequest, res: Response): void {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM ngos WHERE is_authorized = 1')
    .get() as { count: number };
  res.json({
    hasRegisteredNgo: row.count > 0,
    registeredNgoCount: row.count,
  });
}

export function registerNgo(req: AuthRequest, res: Response): void {
  const {
    ngoName,
    registrationNumber,
    cityState,
    focusArea,
    officialPhone,
    displayName,
    email,
    password,
  } = req.body ?? {};

  if (!isNonEmptyString(ngoName, 160)) {
    res.status(400).json({ error: 'Official NGO name is required.' });
    return;
  }
  if (!isNonEmptyString(registrationNumber, 80) || registrationNumber.trim().length < 4) {
    res.status(400).json({
      error: 'A valid NGO Registration Number / Trust ID (at least 4 characters) is required.',
    });
    return;
  }
  if (!isNonEmptyString(cityState, 120)) {
    res.status(400).json({ error: 'Operating city and state/region are required.' });
    return;
  }
  if (!isNonEmptyString(officialPhone, 40) || officialPhone.trim().length < 7) {
    res.status(400).json({ error: 'Official NGO contact phone number is required.' });
    return;
  }
  if (!isNonEmptyString(displayName, 120)) {
    res.status(400).json({ error: 'Authorized coordinator full name is required.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid official email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
    return;
  }

  const normalizedRegNo = registrationNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFocus = isNonEmptyString(focusArea, 100)
    ? focusArea.trim()
    : 'Community Relief';

  const existingNgo = db
    .prepare('SELECT id FROM ngos WHERE registration_number = ?')
    .get(normalizedRegNo);
  if (existingNgo) {
    res.status(409).json({
      error:
        'An NGO with this Registration Number is already registered. Please sign in with your authorized credentials.',
    });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    res.status(409).json({
      error: 'This email address is already linked to an authorized NGO account. Please sign in.',
    });
    return;
  }

  const passwordHash = hashPassword(password);

  const { userId, ngoId } = runTransaction(() => {
    const ngoInfo = db
      .prepare(
        `INSERT INTO ngos (name, registration_number, city_state, focus_area, official_phone, is_authorized)
         VALUES (?, ?, ?, ?, ?, 1)`
      )
      .run(
        ngoName.trim(),
        normalizedRegNo,
        cityState.trim(),
        normalizedFocus,
        officialPhone.trim()
      );
    const createdNgoId = Number(ngoInfo.lastInsertRowid);

    const userInfo = db
      .prepare(
        `INSERT INTO users (ngo_id, display_name, email, password_hash, role, avatar_url)
         VALUES (?, ?, ?, ?, 'Authorized Coordinator', ?)`
      )
      .run(createdNgoId, displayName.trim(), normalizedEmail, passwordHash, DEFAULT_AVATAR_URL);

    return {
      ngoId: createdNgoId,
      userId: Number(userInfo.lastInsertRowid),
    };
  });

  const user = fetchUserWithNgo(userId);
  const token = signSessionToken(user.id, ngoId, user.email);
  res.status(201).json({ token, user });
}

export function login(req: AuthRequest, res: Response): void {
  const { registrationNumber, email, password } = req.body ?? {};

  if (!isNonEmptyString(registrationNumber, 80)) {
    res.status(400).json({
      error: 'NGO Registration Number is required. Only authorized registered NGOs may sign in.',
    });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid work email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length === 0) {
    res.status(400).json({ error: 'Password is required.' });
    return;
  }

  const normalizedRegNo = registrationNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  const ngo = db
    .prepare('SELECT id, is_authorized AS isAuthorized FROM ngos WHERE registration_number = ?')
    .get(normalizedRegNo) as { id: number; isAuthorized: number } | undefined;

  if (!ngo) {
    res.status(403).json({
      error:
        'NGO Registration Number not found. Only authorized NGOs can access this platform—please register your NGO first.',
    });
    return;
  }

  if (ngo.isAuthorized !== 1) {
    res.status(403).json({
      error: 'This NGO registration is not currently authorized for access.',
    });
    return;
  }

  const row = db
    .prepare(
      `SELECT u.id, u.ngo_id AS ngoId, u.display_name AS displayName, u.email, u.role,
              u.avatar_url AS avatarUrl, u.created_at AS createdAt, u.password_hash AS passwordHash,
              n.name AS ngoName, n.registration_number AS ngoRegistrationNumber,
              n.city_state AS ngoCityState, n.focus_area AS ngoFocusArea,
              n.official_phone AS ngoOfficialPhone, n.is_authorized AS ngoIsAuthorized
       FROM users u
       JOIN ngos n ON n.id = u.ngo_id
       WHERE u.email = ? AND u.ngo_id = ?`
    )
    .get(normalizedEmail, ngo.id) as unknown as JoinedUserWithHash | undefined;

  if (!row || !verifyPassword(password, row.passwordHash)) {
    res.status(401).json({
      error: 'Invalid email, password, or NGO Registration Number. Please check your credentials.',
    });
    return;
  }

  const user: AuthenticatedUser = {
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

  const token = signSessionToken(user.id, user.ngoId, user.email);
  res.json({ token, user });
}

export function getMe(req: AuthRequest, res: Response): void {
  res.json({ user: req.user });
}

export function updateProfile(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const { displayName, role, avatarUrl } = req.body ?? {};

  if (!isNonEmptyString(displayName, 120)) {
    res.status(400).json({ error: 'Display name is required (maximum 120 characters).' });
    return;
  }

  const normalizedRole = isNonEmptyString(role, 60) ? role.trim() : req.user.role;
  const avatarCheck = validateAvatarUrl(avatarUrl);
  if (!avatarCheck.valid) {
    res.status(400).json({ error: avatarCheck.error });
    return;
  }

  db.prepare(
    `UPDATE users
     SET display_name = ?, role = ?, avatar_url = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(displayName.trim(), normalizedRole, avatarCheck.sanitized, req.user.id);

  const updated = fetchUserWithNgo(req.user.id);
  res.json({ user: updated });
}
