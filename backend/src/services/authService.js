import crypto from 'node:crypto';
import { config } from '../config.js';
import { signJwt, signState, verifyState } from '../lib/jwt.js';
import { verifyPassword } from '../lib/password.js';
import {
  attachGoogleUser,
  createLocalUser,
  findRefreshToken,
  findUserByEmail,
  findUserById,
  popOAuthState,
  revokeRefreshToken,
  storeOAuthState,
  storeRefreshToken
} from '../store/memoryStore.js';

const ACCESS_TOKEN_SECONDS = 15 * 60;
const REFRESH_TOKEN_SECONDS = 30 * 24 * 60 * 60;

function userResponse(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function buildSession(user) {
  const refreshJti = crypto.randomUUID();
  const accessToken = signJwt({ sub: user.id, role: user.role, email: user.email }, config.jwtAccessSecret, ACCESS_TOKEN_SECONDS);
  const refreshToken = signJwt({ sub: user.id, jti: refreshJti, type: 'refresh' }, config.jwtRefreshSecret, REFRESH_TOKEN_SECONDS);

  await storeRefreshToken({
    jti: refreshJti,
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TOKEN_SECONDS * 1000
  });

  return {
    accessToken,
    refreshToken,
    user: userResponse(user)
  };
}

export async function registerUser({ name, email, password }) {
  if (await findUserByEmail(email)) {
    throw new Error('An account with that email already exists');
  }

  const user = await createLocalUser({ name, email, password, role: 'user' });
  return buildSession(user);
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid email or password');
  }

  return buildSession(user);
}

export async function refreshSession(refreshTokenPayload) {
  const tokenRecord = await findRefreshToken(refreshTokenPayload.jti);
  if (!tokenRecord || tokenRecord.revoked || tokenRecord.userId !== refreshTokenPayload.sub) {
    throw new Error('Refresh token is invalid');
  }

  if (tokenRecord.expiresAt.getTime() <= Date.now()) {
    throw new Error('Refresh token is expired');
  }

  await revokeRefreshToken(refreshTokenPayload.jti);
  const user = await findUserById(refreshTokenPayload.sub);
  if (!user) {
    throw new Error('User not found');
  }

  return buildSession(user);
}

export function buildGoogleAuthorizationUrl() {
  const state = signState({ nonce: crypto.randomUUID() }, config.jwtStateSecret);
  storeOAuthState(state, { createdAt: Date.now() });
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state
  });

  return { state, url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
}

async function exchangeGoogleCode(code) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Unable to exchange Google code');
  }

  return tokenResponse.json();
}

function decodeJwtPayload(token) {
  const payload = token?.split('.')[1];
  if (!payload) {
    return null;
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Unable to load Google profile');
  }

  return response.json();
}

export async function handleGoogleCallback({ code, state }) {
  verifyState(state, config.jwtStateSecret);
  const stateRecord = popOAuthState(state);
  if (!stateRecord) {
    throw new Error('OAuth state expired');
  }

  const tokenData = await exchangeGoogleCode(code);
  let profile = decodeJwtPayload(tokenData.id_token);
  if (!profile?.email) {
    profile = await fetchGoogleProfile(tokenData.access_token);
  }

  if (!profile?.email) {
    throw new Error('Google profile is missing email');
  }

  const user = await attachGoogleUser({
    name: profile.name ?? profile.email,
    email: profile.email,
    providerAccountId: profile.sub ?? profile.id
  });

  return buildSession(user);
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return userResponse(user);
}
