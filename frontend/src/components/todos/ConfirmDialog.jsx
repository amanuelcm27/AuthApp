/**
 * Confirmation Dialog Component
 */

export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) {
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
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>{title}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>{message}</p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="secondary-button"
            onClick={onCancel}
            style={{ padding: '12px 24px' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: isDangerous ? 'var(--danger)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
