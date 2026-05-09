import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import TOTPService from '../services/totpService.js';
import { completeTwoFactorLogin } from '../services/authService.js';
import { asyncHandler } from '../utils/errorHandler.js';

const router = express.Router();

// GET /api/auth/2fa/setup - Get QR code and secret for 2FA setup
router.get('/setup', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.sub;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.twoFactorEnabled) {
    return res.status(400).json({ error: '2FA is already enabled' });
  }

  // Generate new secret
  const { secret, qrCode, otpauthUrl } = await TOTPService.generateSecret(user.email);
  const backupCodes = TOTPService.generateBackupCodes();

  // Store temporary data in response (client will verify before saving)
  res.json({
    secret,
    qrCode,
    otpauthUrl,
    backupCodes,
  });
}));

// POST /api/auth/2fa/verify-setup - Verify TOTP code and enable 2FA
router.post('/verify-setup', requireAuth, asyncHandler(async (req, res) => {
  const { secret, token, backupCodes } = req.body;
  const userId = req.auth.sub;

  if (!secret || !token) {
    return res.status(400).json({ error: 'Missing secret or token' });
  }

  // Verify the TOTP token
  const isValid = TOTPService.verifyToken(secret, token);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // Save secret and backup codes to database
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: JSON.stringify(backupCodes),
    },
  });

  res.json({ message: '2FA enabled successfully' });
}));

// POST /api/auth/2fa/disable - Disable 2FA (user must be authenticated)
router.post('/disable', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.auth.sub;

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });

  res.json({ message: '2FA disabled successfully' });
}));

// POST /api/auth/2fa/verify-login - Verify TOTP token during login
router.post('/verify-login', asyncHandler(async (req, res) => {
  const { userId, token, useBackupCode } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'Missing userId or token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.twoFactorEnabled) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  let isValid = false;
  let remaining = null;
  let updatedUser = user;

  if (useBackupCode) {
    // Verify backup code
    const result = TOTPService.verifyBackupCode(user.backupCodes, token);
    if (result.valid) {
      isValid = true;
      // Update remaining backup codes
      if (result.remaining.length > 0) {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { backupCodes: JSON.stringify(result.remaining) },
        });
      }
      remaining = result.remaining.length;
    }
  } else {
    // Verify TOTP token
    isValid = TOTPService.verifyToken(user.twoFactorSecret, token);
  }

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // 2FA verified - complete login by building session
  const { completeTwoFactorLogin } = await import('../services/authService.js');
  const session = await completeTwoFactorLogin(userId);

  // Set auth cookie
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/auth/refresh',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  const response = {
    message: '2FA verified',
    ...session,
  };

  if (useBackupCode) {
    response.backupCodesRemaining = remaining;
  }

  res.json(response);
}));

export default router;
