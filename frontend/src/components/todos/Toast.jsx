/**
 * Toast Notification Component
 */

import { useState, useEffect } from 'react';

export function Toast({ message, type = 'success' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const bgColor = type === 'error' ? 'var(--danger)' : 'var(--accent)';
  const textColor = '#fff';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '16px 24px',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      {message}
    </div>
  );
}
