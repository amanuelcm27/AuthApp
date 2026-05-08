/**
 * Todo Card Component - displays a single todo item
 */

import { useTodo } from '../../context/TodoContext';

export function TodoCard({ todo, onEdit, onDelete }) {
  const { toggleTodo } = useTodo();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'var(--danger)'; // red
      case 'MEDIUM': return 'var(--accent)'; // orange
      case 'LOW': return '#4a90e2'; // blue
      default: return 'transparent';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  const handleToggle = async () => {
    try {
      await toggleTodo(todo.id);
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  return (
    <li
      className="todo-item"
      style={{
        borderLeft: todo.priority ? `4px solid ${getPriorityColor(todo.priority)}` : 'none'
      }}
    >
      <label style={{ flex: 1 }}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
        />
        <span className={todo.completed ? 'todo-done' : ''}>{todo.title}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--muted)' }}>
          {todo.dueDate && (
            <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>
              📅 {formatDate(todo.dueDate)}
            </span>
          )}
          {todo.priority && (
            <span style={{ color: getPriorityColor(todo.priority) }}>
              {todo.priority}
            </span>
          )}
        </div>
      </label>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="link-button"
          type="button"
          onClick={() => onEdit?.(todo)}
          style={{ fontSize: '12px' }}
        >
          Edit
        </button>
        <button
          className="link-button"
          type="button"
          onClick={() => onDelete?.(todo)}
          style={{ fontSize: '12px', color: 'var(--danger)' }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
