/**
 * Todo Filters Component
 */

import { useTodo } from '../../context/TodoContext';

export function TodoFilters() {
  const { filters, updateFilters } = useTodo();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
      <input
        type="text"
        placeholder="Search todos..."
        value={filters.search}
        onChange={e => updateFilters({ search: e.target.value })}
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          color: 'var(--text)',
          fontSize: '14px'
        }}
      />

      <select
        value={filters.status}
        onChange={e => updateFilters({ status: e.target.value })}
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          color: 'var(--text)',
          fontSize: '14px'
        }}
      >
        <option value="all">All Todos</option>
        <option value="active">Active Only</option>
        <option value="completed">Completed Only</option>
      </select>

      <select
        value={filters.priority || ''}
        onChange={e => updateFilters({ priority: e.target.value || null })}
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          color: 'var(--text)',
          fontSize: '14px'
        }}
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <select
        value={filters.sort}
        onChange={e => updateFilters({ sort: e.target.value })}
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          color: 'var(--text)',
          fontSize: '14px'
        }}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="completed-first">Completed First</option>
      </select>
    </div>
  );
}
