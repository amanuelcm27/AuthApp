import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listUsers,
  createLocalUser,
  deleteUserById,
  updateUserRole,
  setUserDisabled
} from '../store/memoryStore.js';

const router = express.Router();

// All routes here require an authenticated admin
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users - list users
router.get('/users', async (req, res, next) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

// GET /api/admin/health - simple health check for admin area
router.get('/health', async (req, res) => {
  return res.json({ status: 'ok' });
});

// POST /api/admin/users - create a new user (can be admin)
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const user = await createLocalUser({ name, email, password, role });
    // Do not return passwordHash
    const { passwordHash, ...safe } = user;
    return res.status(201).json({ user: safe });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/admin/users/:id - update role or disabled flag
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, disabled } = req.body;

    let updated = null;

    if (typeof role === 'string') {
      updated = await updateUserRole(id, role);
    }

    if (typeof disabled === 'boolean') {
      updated = await setUserDisabled(id, disabled);
    }

    if (!updated) {
      return res.status(400).json({ message: 'No valid update provided' });
    }

    const { passwordHash, ...safe } = updated;
    return res.json({ user: safe });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/admin/users/:id - delete user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteUserById(id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
