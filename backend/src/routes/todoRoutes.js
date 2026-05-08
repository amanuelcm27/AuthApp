/**
 * Todo routes - all todo-related endpoints
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errorHandler.js';
import {
  handleCreateTodo,
  handleGetTodos,
  handleGetTodo,
  handleUpdateTodo,
  handleToggleTodo,
  handleDeleteTodo,
  handleClearCompleted,
  handleGetStats
} from '../controllers/todoController.js';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(requireAuth);

/**
 * GET /todos - Get all todos (with filtering, searching, sorting, pagination)
 */
router.get('/', asyncHandler(handleGetTodos));

/**
 * GET /todos/stats - Get todo statistics
 */
router.get('/stats', asyncHandler(handleGetStats));

/**
 * POST /todos - Create a new todo
 */
router.post('/', asyncHandler(handleCreateTodo));

/**
 * GET /todos/:id - Get a single todo
 */
router.get('/:id', asyncHandler(handleGetTodo));

/**
 * PUT /todos/:id - Update a todo
 */
router.put('/:id', asyncHandler(handleUpdateTodo));

/**
 * PATCH /todos/:id/toggle - Toggle todo completion
 */
router.patch('/:id/toggle', asyncHandler(handleToggleTodo));

/**
 * DELETE /todos/:id - Delete a todo
 */
router.delete('/:id', asyncHandler(handleDeleteTodo));

/**
 * DELETE /todos/completed/all - Clear all completed todos
 */
router.delete('/completed/all', asyncHandler(handleClearCompleted));

export default router;
