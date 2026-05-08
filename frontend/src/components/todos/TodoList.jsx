/**
 * Todo List Component - displays all filtered todos
 */

import { TodoCard } from './TodoCard';
import { useTodo } from '../../context/TodoContext';

export function TodoList({ onEditTodo, onDeleteTodo }) {
  const { filteredTodos, loading, stats } = useTodo();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
        Loading todos...
      </div>
    );
  }

  if (filteredTodos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
        <p style={{ fontSize: '16px', margin: 0 }}>No todos yet.</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onEdit={onEditTodo}
            onDelete={onDeleteTodo}
          />
        ))}
      </ul>
    </div>
  );
}
