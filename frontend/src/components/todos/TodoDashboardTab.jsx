import { useState } from 'react';
import { useTodo } from '../../context/TodoContext.jsx';
import { TodoForm } from './TodoForm.jsx';
import { TodoFilters } from './TodoFilters.jsx';
import { TodoStats } from './TodoStats.jsx';
import { TodoList } from './TodoList.jsx';
import { EditTodoModal } from './TodoEditModal.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { Toast } from './Toast.jsx';

const TODO_TABS = [
  { id: 'create', label: 'Create' },
  { id: 'list', label: 'List' },
  { id: 'stats', label: 'Stats' }
];

function TodoSection({ title, children, withDivider = true }) {
  return (
    <section style={{ marginBottom: '24px', paddingBottom: withDivider ? '24px' : 0, borderBottom: withDivider ? '1px solid var(--line)' : 'none' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function TodoCreateSection() {
  return (
    <TodoSection title="Add Todo">
      <TodoForm />
    </TodoSection>
  );
}

function TodoSearchSection() {
  return (
    <TodoSection title="Filters & Search">
      <TodoFilters />
    </TodoSection>
  );
}

function TodoStatisticsSection() {
  return (
    <TodoSection title="Statistics">
      <TodoStats />
    </TodoSection>
  );
}

function TodoListSection({ onEditTodo, onDeleteTodo }) {
  return (
    <TodoSection title="Todo List" withDivider={false}>
      <TodoList onEditTodo={onEditTodo} onDeleteTodo={onDeleteTodo} />
    </TodoSection>
  );
}

function TodoBulkActions({ onClearCompleted }) {
  return (
    <button onClick={onClearCompleted} className="secondary-button" style={{ marginTop: '16px' }}>
      Clear Completed Todos
    </button>
  );
}

export function TodoDashboardTab() {
  const { toast, deleteTodo, clearCompleted } = useTodo();
  const [activeTab, setActiveTab] = useState('list');
  const [editingTodo, setEditingTodo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [clearCompletedConfirm, setClearCompletedConfirm] = useState(false);

  async function confirmDelete() {
    if (!deleteConfirm) {
      return;
    }

    try {
      await deleteTodo(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  async function confirmClearCompleted() {
    try {
      await clearCompleted();
      setClearCompletedConfirm(false);
    } catch (err) {
      console.error('Clear error:', err);
    }
  }

  return (
    <div>
      <div className="todo-subtabs" role="tablist" aria-label="Todo sections">
        {TODO_TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'todo-subtab is-active' : 'todo-subtab'}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && <TodoCreateSection />}
      {activeTab === 'stats' && <TodoStatisticsSection />}
      {activeTab === 'list' && (
        <>
          {/* Filters live inside the List view for better UX */}
          <TodoSearchSection />
          <TodoListSection onEditTodo={setEditingTodo} onDeleteTodo={setDeleteConfirm} />
          <TodoBulkActions onClearCompleted={() => setClearCompletedConfirm(true)} />
        </>
      )}

      {editingTodo && (
        <EditTodoModal
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSave={() => setEditingTodo(null)}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Todo?"
          message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {clearCompletedConfirm && (
        <ConfirmDialog
          title="Clear All Completed?"
          message="This will permanently delete all completed todos. This action cannot be undone."
          confirmText="Delete All"
          cancelText="Cancel"
          isDangerous
          onConfirm={confirmClearCompleted}
          onCancel={() => setClearCompletedConfirm(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
