import express from 'express';
import { config } from '../config.js';
import { verifyJwt } from '../lib/jwt.js';
import { handleGoogleCallback, loginUser, registerUser, refreshSession, buildGoogleAuthorizationUrl, getCurrentUser } from '../services/authService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createTodo, deleteTodo, deleteUserById, findUserById, listTodosByUserId, listUsers, updateTodo } from '../store/memoryStore.js';

const router = express.Router();

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

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

router.get('/todos', requireAuth, asyncHandler(async (request, response) => {
  const todos = await listTodosByUserId(request.auth.sub);
  return response.json({ todos });
}));

router.post('/todos', requireAuth, asyncHandler(async (request, response) => {
  const title = String(request.body?.title ?? '').trim();
  if (title.length < 2) {
    return response.status(400).json({ message: 'Todo title must be at least 2 characters' });
  }

  const todo = await createTodo({ userId: request.auth.sub, title });
  return response.status(201).json({ todo });
}));

router.patch('/todos/:todoId', requireAuth, asyncHandler(async (request, response) => {
  const nextTitle = typeof request.body?.title === 'string' ? request.body.title.trim() : undefined;
  const nextCompleted = typeof request.body?.completed === 'boolean' ? request.body.completed : undefined;

  if (typeof nextTitle === 'string' && nextTitle.length < 2) {
    return response.status(400).json({ message: 'Todo title must be at least 2 characters' });
  }

  const todo = await updateTodo({
    todoId: request.params.todoId,
    userId: request.auth.sub,
    title: nextTitle,
    completed: nextCompleted
  });

  if (!todo) {
    return response.status(404).json({ message: 'Todo not found' });
  }

  return response.json({ todo });
}));

router.delete('/todos/:todoId', requireAuth, asyncHandler(async (request, response) => {
  const removed = await deleteTodo({ todoId: request.params.todoId, userId: request.auth.sub });
  if (!removed) {
    return response.status(404).json({ message: 'Todo not found' });
  }

  return response.json({ message: 'Todo deleted' });
}));

export default router;
