/**
 * Edit Todo Modal Component
 */

import { useState } from 'react';
import { useTodo } from '../../context/TodoContext';

export function EditTodoModal({ todo, onClose, onSave }) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.notes || '');
  const [priority, setPriority] = useState(todo.priority || '');
  const [dueDate, setDueDate] = useState(todo.dueDate ? todo.dueDate.split('T')[0] : '');
  const [loading, setLoading] = useState(false);
  const { updateTodo, showToast } = useTodo();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateTodo(todo.id, {
        title: title.trim(),
        notes: description.trim() || null,
        priority: priority || null,
        dueDate: dueDate || null
      });
      onClose?.();
      onSave?.();
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Edit Todo</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">None</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="secondary-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-button"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
