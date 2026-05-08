/**
 * Todo input validation
 */

import { validationError } from '../utils/errorHandler.js';

const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const MIN_TITLE_LENGTH = 2;
const MAX_TITLE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Validate title
 */
export function validateTitle(title) {
  if (typeof title !== 'string') {
    throw validationError('Title must be a string', 'title', 'INVALID_TYPE');
  }

  const trimmed = title.trim();

  if (trimmed.length < MIN_TITLE_LENGTH) {
    throw validationError(`Title must be at least ${MIN_TITLE_LENGTH} characters`, 'title', 'TOO_SHORT');
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw validationError(`Title must not exceed ${MAX_TITLE_LENGTH} characters`, 'title', 'TOO_LONG');
  }

  return trimmed;
}

/**
 * Validate description/notes
 */
export function validateNotes(notes) {
  if (notes === null || notes === undefined || notes === '') {
    return null;
  }

  if (typeof notes !== 'string') {
    throw validationError('Description must be a string', 'notes', 'INVALID_TYPE');
  }

  const trimmed = notes.trim();

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw validationError(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, 'notes', 'TOO_LONG');
  }

  return trimmed || null;
}

/**
 * Validate priority
 */
export function validatePriority(priority) {
  if (priority === null || priority === undefined || priority === '') {
    return null;
  }

  if (typeof priority !== 'string') {
    throw validationError('Priority must be a string', 'priority', 'INVALID_TYPE');
  }

  const upper = priority.toUpperCase();

  if (!PRIORITY_LEVELS.includes(upper)) {
    throw validationError(`Priority must be one of: ${PRIORITY_LEVELS.join(', ')}`, 'priority', 'INVALID_VALUE');
  }

  return upper;
}

/**
 * Validate due date
 */
export function validateDueDate(dueDate) {
  if (dueDate === null || dueDate === undefined || dueDate === '') {
    return null;
  }

  const date = new Date(dueDate);

  if (isNaN(date.getTime())) {
    throw validationError('Due date must be a valid ISO date', 'dueDate', 'INVALID_DATE');
  }

  return date;
}

/**
 * Validate completed status
 */
export function validateCompleted(completed) {
  if (typeof completed !== 'boolean') {
    throw validationError('Completed must be a boolean', 'completed', 'INVALID_TYPE');
  }

  return completed;
}

/**
 * Validate create todo request
 */
export function validateCreateTodoRequest(body) {
  const title = validateTitle(body?.title);
  const notes = validateNotes(body?.notes);
  const priority = validatePriority(body?.priority);
  const dueDate = validateDueDate(body?.dueDate);

  return {
    title,
    notes,
    priority,
    dueDate
  };
}

/**
 * Validate update todo request
 */
export function validateUpdateTodoRequest(body) {
  const updates = {};

  if (typeof body?.title === 'string') {
    updates.title = validateTitle(body.title);
  }

  if (body?.notes !== undefined) {
    updates.notes = validateNotes(body.notes);
  }

  if (body?.priority !== undefined) {
    updates.priority = validatePriority(body.priority);
  }

  if (body?.dueDate !== undefined) {
    updates.dueDate = validateDueDate(body.dueDate);
  }

  if (typeof body?.completed === 'boolean') {
    updates.completed = validateCompleted(body.completed);
  }

  return updates;
}

/**
 * Validate pagination
 */
export function validatePagination(pageStr, limitStr) {
  let page = 1;
  let limit = 20;

  if (pageStr) {
    const parsed = parseInt(pageStr, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw validationError('Page must be a positive integer', 'page', 'INVALID_PAGE');
    }
    page = parsed;
  }

  if (limitStr) {
    const parsed = parseInt(limitStr, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      throw validationError('Limit must be between 1 and 100', 'limit', 'INVALID_LIMIT');
    }
    limit = parsed;
  }

  return { page, limit };
}

/**
 * Validate filter query params
 */
export function validateFilterParams(query) {
  const params = {
    search: null,
    status: 'all', // 'all', 'completed', 'active'
    priority: null,
    sort: 'newest' // 'newest', 'oldest', 'completed-first'
  };

  if (query.search && typeof query.search === 'string') {
    const trimmed = query.search.trim();
    if (trimmed.length > 0) {
      params.search = trimmed;
    }
  }

  if (query.status && typeof query.status === 'string') {
    const status = query.status.toLowerCase();
    if (['all', 'completed', 'active'].includes(status)) {
      params.status = status;
    }
  }

  if (query.priority && typeof query.priority === 'string') {
    const priority = validatePriority(query.priority);
    params.priority = priority;
  }

  if (query.sort && typeof query.sort === 'string') {
    const sort = query.sort.toLowerCase();
    if (['newest', 'oldest', 'completed-first'].includes(sort)) {
      params.sort = sort;
    }
  }

  return params;
}
