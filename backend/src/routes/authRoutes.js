import express from 'express';
import { config } from '../config.js';
import { verifyJwt } from '../lib/jwt.js';
import { handleGoogleCallback, loginUser, registerUser, refreshSession, buildGoogleAuthorizationUrl, getCurrentUser } from '../services/authService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errorHandler.js';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { deleteUserById, findUserById, listUsers, updateUserProfile, setUserDisabled } from '../store/memoryStore.js';

const router = express.Router();

// ensure uploads folder exists
const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `${req.auth?.sub ?? 'anon'}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

function setAuthCookies(response, session) {
  response.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/auth/refresh',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

router.post('/register', asyncHandler(async (request, response) => {
  const session = await registerUser(request.body);
  setAuthCookies(response, session);
  return response.json(session);
}));

router.post('/login', asyncHandler(async (request, response) => {
  const session = await loginUser(request.body);
  setAuthCookies(response, session);
  return response.json(session);
}));

router.post('/refresh', asyncHandler(async (request, response) => {
  const token = request.cookies.refreshToken;
  if (!token) {
    return response.status(401).json({ message: 'Refresh token missing' });
  }

  let payload;
  try {
    payload = verifyJwt(token, config.jwtRefreshSecret);
  } catch {
    return response.status(401).json({ message: 'Refresh token is invalid or expired' });
  }

  const session = await refreshSession(payload);
  setAuthCookies(response, session);
  return response.json(session);
}));

router.post('/logout', (request, response) => {
  response.clearCookie('refreshToken', { path: '/auth/refresh' });
  return response.json({ message: 'Signed out' });
});

router.get('/me', requireAuth, asyncHandler(async (request, response) => {
  return response.json({ user: await getCurrentUser(request.auth.sub) });
}));

router.patch('/me', requireAuth, asyncHandler(async (request, response) => {
  const { name, bio, avatarUrl } = request.body ?? {};
  const updated = await updateUserProfile(request.auth.sub, { name, bio, avatarUrl });
  const { passwordHash, ...safe } = updated;
  return response.json({ user: safe });
}));

router.post('/me/avatar', requireAuth, upload.single('avatar'), asyncHandler(async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ message: 'No file uploaded' });
  }

  const relPath = `/uploads/avatars/${request.file.filename}`;
  const updated = await updateUserProfile(request.auth.sub, { avatarUrl: relPath });
  const { passwordHash, ...safe } = updated;
  return response.json({ user: safe });
}));

router.get('/google/start', (request, response) => {
  const { url } = buildGoogleAuthorizationUrl();
  return response.redirect(url);
});

router.get('/google/callback', async (request, response) => {
  try {
    const session = await handleGoogleCallback({ code: request.query.code, state: request.query.state });
    setAuthCookies(response, session);
    return response.redirect(`${config.clientUrl}/auth/callback?accessToken=${encodeURIComponent(session.accessToken)}`);
  } catch (error) {
    return response.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.get('/admin/health', requireAuth, requireRole('admin'), (request, response) => {
  return response.json({ status: 'ok', scope: 'admin' });
});

router.get('/admin/users', requireAuth, requireRole('admin'), asyncHandler(async (_request, response) => {
  const users = await listUsers();
  return response.json({ users });
}));

router.delete('/admin/users/:userId', requireAuth, requireRole('admin'), asyncHandler(async (request, response) => {
  if (request.params.userId === request.auth.sub) {
    return response.status(400).json({ message: 'You cannot delete your own account' });
  }

  const user = await findUserById(request.params.userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  await deleteUserById(request.params.userId);
  return response.json({ message: 'User deleted' });
}));

router.patch('/admin/users/:userId', requireAuth, requireRole('admin'), asyncHandler(async (request, response) => {
  const { disabled } = request.body ?? {};
  if (request.params.userId === request.auth.sub) {
    return response.status(400).json({ message: 'You cannot modify your own admin account' });
  }

  const user = await findUserById(request.params.userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  await setUserDisabled(request.params.userId, !!disabled);
  return response.json({ message: 'User updated' });
}));

export default router;
