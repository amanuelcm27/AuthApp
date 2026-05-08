/**
 * Todo Context - centralized state management for todos
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api';

const TodoContext = createContext(null);

/**
 * Todo statistics
 */
function calculateStats(todos) {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const remaining = total - completed;
  return { total, completed, remaining };
}

/**
 * Filter and sort todos based on current filters
 */
function filterAndSortTodos(todos, filters) {
  let filtered = [...todos];

  // Status filter
  if (filters.status === 'completed') {
    filtered = filtered.filter(t => t.completed);
  } else if (filters.status === 'active') {
    filtered = filtered.filter(t => !t.completed);
  }

  // Priority filter
  if (filters.priority) {
    filtered = filtered.filter(t => t.priority === filters.priority);
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(searchLower) ||
      (t.notes && t.notes.toLowerCase().includes(searchLower))
    );
  }

  // Sorting
  if (filters.sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (filters.sort === 'completed-first') {
    filtered.sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.completed ? -1 : 1;
    });
  } else {
    // Default: newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return filtered;
}

/**
 * TodoProvider component
 */
export function TodoProvider({ children }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // 'all', 'completed', 'active'
    priority: null,
    sort: 'newest' // 'newest', 'oldest', 'completed-first'
  });

  /**
   * Show toast notification
   */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /**
   * Fetch all todos for current user
   */
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.listTodos(filters);
      setTodos(result.todos || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load todos';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  /**
   * Load todos on mount
   */
  useEffect(() => {
    fetchTodos();
  }, [filters, fetchTodos]);

  /**
   * Create a new todo
   */
  const createTodo = useCallback(async (todoData) => {
    setError('');
    try {
      const result = await api.createTodo(todoData);
      setTodos(current => [result.todo, ...current]);
      showToast('Todo created');
      return result.todo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create todo';
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  }, [showToast]);

  /**
   * Update an existing todo
   */
  const updateTodo = useCallback(async (todoId, updates) => {
    setError('');
    try {
      const result = await api.updateTodo(todoId, updates);
      setTodos(current => current.map(t => (t.id === todoId ? result.todo : t)));
      showToast('Todo updated');
      return result.todo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update todo';
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  }, [showToast]);

  /**
   * Toggle todo completion status
   */
  const toggleTodo = useCallback(async (todoId) => {
    setError('');
    try {
      const result = await api.toggleTodo(todoId);
      setTodos(current => current.map(t => (t.id === todoId ? result.todo : t)));
      return result.todo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle todo';
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  }, [showToast]);

  /**
   * Delete a todo
   */
  const deleteTodo = useCallback(async (todoId) => {
    setError('');
    try {
      await api.deleteTodo(todoId);
      setTodos(current => current.filter(t => t.id !== todoId));
      showToast('Todo deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo';
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  }, [showToast]);

  /**
   * Clear all completed todos
   */
  const clearCompleted = useCallback(async () => {
    setError('');
    try {
      const result = await api.clearCompletedTodos();
      setTodos(current => current.filter(t => !t.completed));
      showToast(`Deleted ${result.deleted} completed todo(s)`);
      return result.deleted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear completed todos';
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  }, [showToast]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(current => ({ ...current, ...newFilters }));
  }, []);

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: null,
      sort: 'newest'
    });
  }, []);

  // Calculate stats from filtered todos
  const filteredTodos = filterAndSortTodos(todos, filters);
  const stats = calculateStats(todos); // Stats from ALL todos, not filtered

  const uncompletedCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.length - uncompletedCount;

  const value = {
    // State
    todos,
    filteredTodos,
    loading,
    error,
    toast,
    filters,
    stats: {
      ...stats,
      uncompletedCount,
      completedCount
    },

    // Actions
    fetchTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    updateFilters,
    resetFilters,
    showToast,
    setError
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

/**
 * Hook to use TodoContext
 */
export function useTodo() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within TodoProvider');
  }
  return context;
}
