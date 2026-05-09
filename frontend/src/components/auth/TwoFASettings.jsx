import { useState, useEffect } from 'react';
import { api } from '../../api.js';

export function TwoFASettings({ user, onUpdated }) {
  const [enabled, setEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Two-Factor Authentication</h3>
        {enabled ? (
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid #4CAF50' }}>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>✓ Two-factor authentication is enabled</p>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>
              Your account is protected with two-factor authentication using your authenticator app.
            </p>
            <button
              className="secondary-button"
              onClick={() => handleDisable()}
              disabled={loading}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : (
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(255, 152, 0, 0.1)', borderLeft: '4px solid #FF9800' }}>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>⚠ Two-factor authentication is not enabled</p>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>
              Improve your account security by enabling two-factor authentication with an authenticator app.
            </p>
            <button
              className="primary-button"
              onClick={() => setShowSetup(true)}
              disabled={loading}
            >
              Enable 2FA
            </button>
          </div>
        )}
      </div>

      {showSetup && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <TwoFASetupFlow
            onSuccess={() => {
              setShowSetup(false);
              setEnabled(true);
              if (onUpdated) onUpdated();
            }}
            onCancel={() => setShowSetup(false)}
          />
        </div>
      )}
    </div>
  );

  async function handleDisable() {
    if (!confirm('Are you sure? You will need to set up 2FA again to re-enable it.')) {
      return;
    }
    setLoading(true);
    try {
      await api.disable2FA();
      setEnabled(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
}

function TwoFASetupFlow({ onSuccess, onCancel }) {
  const [step, setStep] = useState('loading'); // 'loading' | 'qrcode' | 'verify' | 'backup'
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSetup();
  }, []);

  async function loadSetup() {
    try {
      const data = await api.setup2FA();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('qrcode');
    } catch (err) {
      setError(err.message);
      setStep('qrcode');
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.verify2FASetup({
        secret,
        token: verificationCode,
        backupCodes
      });
      setStep('backup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'qrcode') {
    return (
      <div>
        <h3 style={{ marginBottom: 16 }}>Set Up Two-Factor Authentication</h3>
        <div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 12, color: 'var(--muted)' }}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
          </p>
          {qrCode && (
            <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200, marginBottom: 16 }} />
          )}
          <div style={{ padding: 12, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 8, marginBottom: 16, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {secret}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Can't scan? Enter this key manually in your authenticator app.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <label style={{ marginBottom: 16 }}>
            <span style={{ display: 'block', marginBottom: 8 }}>Verify Code</span>
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
              required
              disabled={loading}
            />
          </label>
          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button
              type="submit"
              className="primary-button"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div>
        <h3 style={{ marginBottom: 16 }}>Save Your Backup Codes</h3>
        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255, 152, 0, 0.1)', borderRadius: 8, borderLeft: '4px solid #FF9800' }}>
          <p style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>
            💾 Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
          </p>
          <div style={{ fontFamily: 'monospace', background: 'rgba(0, 0, 0, 0.2)', padding: 12, borderRadius: 4, marginBottom: 12 }}>
            {backupCodes.map((code, idx) => (
              <div key={idx} style={{ padding: '4px 0' }}>{code}</div>
            ))}
          </div>
          <button
            type="button"
            className="secondary-button"
            style={{ marginBottom: 12 }}
            onClick={() => {
              const codes = backupCodes.join('\n');
              navigator.clipboard.writeText(codes).then(() => {
                alert('Backup codes copied to clipboard');
              });
            }}
          >
            Copy Codes
          </button>
        </div>

        <button
          className="primary-button"
          onClick={onSuccess}
          style={{ width: '100%' }}
        >
          Done - I've Saved the Codes
        </button>
      </div>
    );
  }

  return <p>Loading setup...</p>;
}
