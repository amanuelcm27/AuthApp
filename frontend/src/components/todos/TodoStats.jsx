/**
 * Todo Statistics Component
 */

import { useTodo } from '../../context/TodoContext';

export function TodoStats() {
  const { stats } = useTodo();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
          {stats.total}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Total Todos
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a90e2', marginBottom: '4px' }}>
          {stats.uncompletedCount}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Remaining
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '4px' }}>
          {stats.completedCount}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Completed
        </div>
      </div>
    </div>
  );
}
