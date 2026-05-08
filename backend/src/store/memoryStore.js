import crypto from 'node:crypto';
import { hashPassword } from '../lib/password.js';
import { prisma } from '../db/prisma.js';

function createUserSeed({ id, name, email, password, role }) {
  return {
    id,
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    provider: 'local',
    providerAccountId: null,
    createdAt: new Date()
  };
}

const userSeeds = [
  createUserSeed({ id: 'user_admin', name: 'Avery Admin', email: 'admin@authapp.local', password: 'Admin123!', role: 'admin' }),
  createUserSeed({ id: 'user_demo', name: 'Jordan User', email: 'user@authapp.local', password: 'User123!', role: 'user' })
];

const oauthStates = new Map();

export async function ensureSeedData() {
  for (const seed of userSeeds) {
    const existing = await findUserByEmail(seed.email);
    if (!existing) {
      await prisma.user.create({ data: seed });
    }
  }
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return users.map(({ passwordHash, ...user }) => user);
}

export async function deleteUserById(userId) {
  await prisma.user.delete({ where: { id: userId } });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createLocalUser({ name, email, password, role = 'user' }) {
  return prisma.user.create({
    data: {
      id: `user_${crypto.randomUUID()}`,
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      provider: 'local',
      providerAccountId: null
    }
  });
}

export async function attachGoogleUser({ name, email, providerAccountId }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        provider: 'google',
        providerAccountId,
        name: existing.name || name
      }
    });
  }

  return prisma.user.create({
    data: {
      id: `user_${crypto.randomUUID()}`,
      name,
      email: normalizedEmail,
      passwordHash: null,
      role: 'user',
      provider: 'google',
      providerAccountId
    }
  });
}

export async function storeRefreshToken({ jti, userId, expiresAt }) {
  await prisma.refreshToken.create({
    data: {
      jti,
      userId,
      expiresAt: new Date(expiresAt),
      revoked: false
    }
  });
}

export async function findRefreshToken(jti) {
  return prisma.refreshToken.findUnique({ where: { jti } });
}

export async function revokeRefreshToken(jti) {
  await prisma.refreshToken.updateMany({
    where: { jti },
    data: { revoked: true }
  });
}

export async function listTodosByUserId(userId) {
  return prisma.todo.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createTodo({ userId, title }) {
  return prisma.todo.create({
    data: {
      id: `todo_${crypto.randomUUID()}`,
      userId,
      title,
      completed: false,
      completedAt: null
    }
  });
}

export async function updateTodo({ todoId, userId, title, completed }) {
  const existing = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!existing || existing.userId !== userId) {
    return null;
  }

  return prisma.todo.update({
    where: { id: todoId },
    data: {
      ...(typeof title === 'string' ? { title } : {}),
      ...(typeof completed === 'boolean'
        ? {
            completed,
            completedAt: completed ? new Date() : null
          }
        : {})
    }
  });
}

export async function deleteTodo({ todoId, userId }) {
  const existing = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!existing || existing.userId !== userId) {
    return false;
  }

  await prisma.todo.delete({ where: { id: todoId } });
  return true;
}

export function storeOAuthState(state, data) {
  oauthStates.set(state, data);
}

export function popOAuthState(state) {
  const data = oauthStates.get(state) ?? null;
  oauthStates.delete(state);
  return data;
}
