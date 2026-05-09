import { useState } from 'react';
import { useAuth } from '../../auth.jsx';

export function TwoFAChallengeForm({ userId, onSuccess, onCancel }) {
  const { verify2FA } = useAuth();
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await verify2FA(userId, code, useBackupCode);
      onSuccess(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <h2>Verify Your Identity</h2>
      <p style={{ color: 'var(--muted)' }}>
        {useBackupCode
          ? 'Enter one of your backup codes'
          : 'Enter the 6-digit code from your authenticator app'}
      </p>
      <label>
        <span>{useBackupCode ? 'Backup Code' : 'Authentication Code'}</span>
        <input
          type="text"
          placeholder={useBackupCode ? 'XXXX-XXXX-XXXX' : '000000'}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          disabled={loading}
          required
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        className="primary-button"
        disabled={loading || !code.trim()}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode('');
            setError('');
          }}
        >
          {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          style={{ marginTop: 12, width: '100%' }}
        >
          Cancel
        </button>
      )}
    </form>
  );
}
