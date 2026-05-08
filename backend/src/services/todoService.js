/**
 * Todo service - business logic for todo operations
 */

import crypto from 'node:crypto';
import { prisma } from '../db/prisma.js';
import { notFoundError, authorizationError } from '../utils/errorHandler.js';

/**
 * Create a new todo for a user
 */
export async function createTodo({ userId, title, notes = null, priority = null, dueDate = null }) {
  return prisma.todo.create({
    data: {
      id: `todo_${crypto.randomUUID()}`,
      userId,
      title,
      notes,
      priority,
      dueDate,
      completed: false,
      completedAt: null
    }
  });
}

/**
 * Get a single todo by ID with ownership check
 */
export async function getTodoById(todoId, userId) {
  const todo = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!todo) {
    throw notFoundError('Todo not found');
  }

  if (todo.userId !== userId) {
    throw authorizationError('You do not have permission to access this todo');
  }

  return todo;
}

/**
 * Get todos with filtering, searching, and sorting
 */
export async function getTodos(userId, { search = null, status = 'all', priority = null, sort = 'newest', page = 1, limit = 20 }) {
  const where = { userId };

  // Status filter
  if (status === 'completed') {
    where.completed = true;
  } else if (status === 'active') {
    where.completed = false;
  }

  // Priority filter
  if (priority) {
    where.priority = priority;
  }

  // Search filter (title and notes)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Sorting
  let orderBy = { createdAt: 'desc' }; // default: newest first

  if (sort === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sort === 'completed-first') {
    orderBy = [{ completed: 'desc' }, { createdAt: 'desc' }];
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Fetch todos and total count
  const [todos, total] = await Promise.all([
    prisma.todo.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        title: true,
        notes: true,
        priority: true,
        completed: true,
        dueDate: true,
        completedAt: true,
        createdAt: true
      }
    }),
    prisma.todo.count({ where })
  ]);

  return {
    todos,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Update a todo with ownership check
 */
export async function updateTodo(todoId, userId, updates) {
  const existing = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!existing) {
    throw notFoundError('Todo not found');
  }

  if (existing.userId !== userId) {
    throw authorizationError('You do not have permission to update this todo');
  }

  // Prepare update data
  const data = {};

  if (typeof updates.title === 'string') {
    data.title = updates.title;
  }

  if (updates.notes !== undefined) {
    data.notes = updates.notes;
  }

  if (typeof updates.priority === 'string') {
    data.priority = updates.priority;
  } else if (updates.priority === null) {
    data.priority = null;
  }

  if (updates.dueDate !== undefined) {
    data.dueDate = updates.dueDate;
  }

  if (typeof updates.completed === 'boolean') {
    data.completed = updates.completed;
    data.completedAt = updates.completed ? new Date() : null;
  }

  return prisma.todo.update({
    where: { id: todoId },
    data
  });
}

/**
 * Toggle todo completion status
 */
export async function toggleTodoCompletion(todoId, userId) {
  const existing = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!existing) {
    throw notFoundError('Todo not found');
  }

  if (existing.userId !== userId) {
    throw authorizationError('You do not have permission to update this todo');
  }

  return prisma.todo.update({
    where: { id: todoId },
    data: {
      completed: !existing.completed,
      completedAt: !existing.completed ? new Date() : null
    }
  });
}

/**
 * Delete a todo with ownership check
 */
export async function deleteTodo(todoId, userId) {
  const existing = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!existing) {
    throw notFoundError('Todo not found');
  }

  if (existing.userId !== userId) {
    throw authorizationError('You do not have permission to delete this todo');
  }

  await prisma.todo.delete({ where: { id: todoId } });
  return true;
}

/**
 * Clear all completed todos for a user
 */
export async function clearCompletedTodos(userId) {
  const result = await prisma.todo.deleteMany({
    where: {
      userId,
      completed: true
    }
  });

  return {
    deleted: result.count
  };
}

/**
 * Get todo statistics for a user
 */
export async function getTodoStats(userId) {
  const [total, completed] = await Promise.all([
    prisma.todo.count({ where: { userId } }),
    prisma.todo.count({ where: { userId, completed: true } })
  ]);

  return {
    total,
    completed,
    remaining: total - completed
  };
}
