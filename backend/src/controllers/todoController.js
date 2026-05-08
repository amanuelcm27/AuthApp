/**
 * Todo controller - request handlers for todo endpoints
 */

import {
  createTodo,
  getTodoById,
  getTodos,
  updateTodo,
  toggleTodoCompletion,
  deleteTodo,
  clearCompletedTodos,
  getTodoStats
} from '../services/todoService.js';

import {
  validateCreateTodoRequest,
  validateUpdateTodoRequest,
  validatePagination,
  validateFilterParams
} from '../validators/todoValidator.js';

/**
 * POST /api/todos - Create a new todo
 */
export async function handleCreateTodo(request, response) {
  const { title, notes, priority, dueDate } = validateCreateTodoRequest(request.body);

  const todo = await createTodo({
    userId: request.auth.sub,
    title,
    notes,
    priority,
    dueDate
  });

  response.status(201).json({ todo });
}

/**
 * GET /api/todos - Get all todos with filtering and pagination
 */
export async function handleGetTodos(request, response) {
  const { page, limit } = validatePagination(request.query.page, request.query.limit);
  const filters = validateFilterParams(request.query);

  const result = await getTodos(request.auth.sub, {
    search: filters.search,
    status: filters.status,
    priority: filters.priority,
    sort: filters.sort,
    page,
    limit
  });

  response.json(result);
}

/**
 * GET /api/todos/:id - Get a single todo
 */
export async function handleGetTodo(request, response) {
  const todo = await getTodoById(request.params.id, request.auth.sub);
  response.json({ todo });
}

/**
 * PUT /api/todos/:id - Update a todo
 */
export async function handleUpdateTodo(request, response) {
  const updates = validateUpdateTodoRequest(request.body);

  const todo = await updateTodo(request.params.id, request.auth.sub, updates);

  response.json({ todo });
}

/**
 * PATCH /api/todos/:id/toggle - Toggle todo completion
 */
export async function handleToggleTodo(request, response) {
  const todo = await toggleTodoCompletion(request.params.id, request.auth.sub);
  response.json({ todo });
}

/**
 * DELETE /api/todos/:id - Delete a todo
 */
export async function handleDeleteTodo(request, response) {
  await deleteTodo(request.params.id, request.auth.sub);
  response.json({ message: 'Todo deleted' });
}

/**
 * DELETE /api/todos/completed/all - Clear all completed todos
 */
export async function handleClearCompleted(request, response) {
  const result = await clearCompletedTodos(request.auth.sub);
  response.json({ message: `Deleted ${result.deleted} completed todo(s)`, deleted: result.deleted });
}

/**
 * GET /api/todos/stats - Get todo statistics
 */
export async function handleGetStats(request, response) {
  const stats = await getTodoStats(request.auth.sub);
  response.json(stats);
}
