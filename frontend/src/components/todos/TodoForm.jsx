/**
 * Todo Form Component - for creating new todos
 */

import { useState } from 'react';
import { useTodo } from '../../context/TodoContext';

export function TodoForm({ onSuccess }) {
  const { createTodo, showToast } = useTodo();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    setLoading(true);
    try {
      await createTodo({
        title: title.trim(),
        notes: description.trim() || null,
        priority: priority || null,
        dueDate: dueDate || null
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      onSuccess?.();
    } catch (err) {
      console.error('Create todo error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gap: '12px' }}>
        <input
          type="text"
          placeholder="What do you need to do?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
          autoFocus
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '16px'
          }}
        />

        <textarea
          placeholder="Add details (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={loading}
          rows={2}
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            color: 'var(--text)',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          >
            <option value="">No priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="primary-button"
          style={{
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Add Todo'}
        </button>
      </div>
    </form>
  );
}
