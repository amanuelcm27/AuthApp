import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api, apiBaseUrl, setAccessToken as syncAccessToken } from './api.js';
import { useAuth } from './auth.jsx';
import { TodoProvider, useTodo } from './context/TodoContext.jsx';
import { TodoForm } from './components/todos/TodoForm.jsx';
import { TodoList } from './components/todos/TodoList.jsx';
import { TodoFilters } from './components/todos/TodoFilters.jsx';
import { TodoStats } from './components/todos/TodoStats.jsx';
import { EditTodoModal } from './components/todos/TodoEditModal.jsx';
import { ConfirmDialog } from './components/todos/ConfirmDialog.jsx';
import { Toast } from './components/todos/Toast.jsx';

// Helper to convert relative upload URLs to absolute URLs
function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${apiBaseUrl}${avatarUrl}`;
}

function decodeJwtPayload(token) {
  const payload = token.split('.')[1] ?? '';
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
}

function getPasswordStrength(password) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) }
  ];

  const passed = checks.filter(check => check.ok).length;
  const strength = passed <= 1 ? 'weak' : passed <= 3 ? 'fair' : passed === 4 ? 'strong' : 'very-strong';

  return {
    strength,
    score: passed,
    checks,
    meetsPolicy: checks.every(check => check.ok)
  };
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">A</div>
          <h1>AuthApp</h1>
          <p>Secure access layer</p>
        </div>
        <nav className="sidebar-tabs">
          {user?.role === 'admin' ? (
            <>
              <button className="tab" onClick={() => navigate('/dashboard?tab=overview')}>Overview</button>
              <button className="tab" onClick={() => navigate('/dashboard?tab=users')}>Users</button>
              <button className="tab" onClick={() => navigate('/dashboard?tab=settings')}>Settings</button>
            </>
          ) : (
            <>
              <button className="tab" onClick={() => navigate('/dashboard?tab=overview')}>Overview</button>
              <button className="tab" onClick={() => navigate('/dashboard?tab=todos')}>Todos</button>
              <button className="tab" onClick={() => navigate('/dashboard?tab=profile')}>Profile</button>
            </>
          )}
        </nav>
        <button className="secondary-button" onClick={logout}>Sign out</button>
      </aside>
      <main className="content-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">Signed in as</span>
            <strong>{user?.name}</strong>
          </div>
          <div className="role-pill">{user?.role}</div>
        </header>
        {children}
      </main>
    </div>
  );
}

function LandingPage({ initial = 'login' }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(initial === 'register' ? 'register' : 'login');

  useEffect(() => {
    setTab(initial === 'register' ? 'register' : 'login');
  }, [initial]);

  return (
    <div className="auth-layout">
      <section className="hero-panel">
        <span className="eyebrow">Todo + secure authentication</span>
        <h1>Manage your todos with secure login, Google OAuth, and role-based access.</h1>
        <div className="hero-stats">
          <div><strong>JWT</strong><span>Access + refresh flow</span></div>
          <div><strong>OAuth</strong><span>Google sign-in</span></div>
          <div><strong>RBAC</strong><span>Admin-only routes</span></div>
        </div>
      </section>
      <section className="auth-card">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className={tab === 'login' ? 'primary-button' : 'secondary-button'}
              onClick={() => {
                setTab('login');
                navigate('/login');
              }}
            >
              Sign in
            </button>
            <button
              className={tab === 'register' ? 'primary-button' : 'secondary-button'}
              onClick={() => {
                setTab('register');
                navigate('/register');
              }}
            >
              Register
            </button>
          </div>
          {tab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </section>
    </div>
  );
}

function AuthForm({ title, submitLabel, onSubmit, footer, children }) {
  return (
    <form className="panel-form" onSubmit={onSubmit}>
      <h2>{title}</h2>
      {children}
      <button className="primary-button" type="submit">{submitLabel}</button>
      {footer}
    </form>
  );
}

function PasswordField({ label = 'Password', name = 'password', placeholder, value, onChange, required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="password-field">
      <span>{label}</span>
      <div className="password-field__control">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.98 8.223A11.96 11.96 0 0 0 1.5 12s3.5 6.5 10.5 6.5c1.303 0 2.515-.177 3.635-.488l-1.49-1.49A6.5 6.5 0 0 1 6.99 9.857L5.4 8.268A12.5 12.5 0 0 0 3.98 8.223Zm3.136-2.08L5.693 4.72l1.06-1.06 12.586 12.586-1.06 1.06-2.24-2.24A10.44 10.44 0 0 1 12 18.5C5 18.5 1.5 12 1.5 12a14.5 14.5 0 0 1 5.616-5.857Zm2.4 2.4A4.5 4.5 0 0 1 14.1 13.28l-2.39-2.39a1.99 1.99 0 0 0-2.195-2.195Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5.5c7 0 10.5 6.5 10.5 6.5s-3.5 6.5-10.5 6.5S1.5 12 1.5 12 5 5.5 12 5.5Zm0 2A4.5 4.5 0 1 0 12 16a4.5 4.5 0 0 0 0-9Zm0 2.5A2 2 0 1 1 12 14a2 2 0 0 1 0-4Z" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());
    body.password = password;

    try {
      await login(body);
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    }
  }

  return (
    <AuthForm
      title="Welcome back"
      submitLabel="Sign in"
      onSubmit={handleSubmit}
      footer={
        <div className="form-footer">
          <a className="link" href={`${apiBaseUrl}/auth/google/start`}>Continue with Google</a>
          <button type="button" className="link-button" onClick={() => navigate('/register')}>Create account</button>
        </div>
      }
    >
      <label>Email<input name="email" type="email" placeholder="admin@authapp.local" required /></label>
      <PasswordField
        label="Password"
        placeholder="Admin123!"
        value={password}
        onChange={event => setPassword(event.target.value)}
      />
      {error ? <p className="form-error">{error}</p> : null}
    </AuthForm>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  const passwordStrength = getPasswordStrength(password);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
      const strength = getPasswordStrength(body.password ?? '');
      if (!strength.meetsPolicy) {
        setError('Use a stronger password before registering.');
        return;
      }

      await register(body);
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    }
  }

  return (
    <AuthForm
      title="Create your account"
      submitLabel="Register"
      onSubmit={handleSubmit}
      footer={
        <div className="form-footer">
          <button type="button" className="link-button" onClick={() => navigate('/login')}>Back to sign in</button>
        </div>
      }
    >
      <label>Name<input name="name" type="text" placeholder="Jordan Taylor" required /></label>
      <label>Email<input name="email" type="email" placeholder="you@company.com" required /></label>
      <PasswordField
        label="Password"
        placeholder="Create a password"
        value={password}
        onChange={event => setPassword(event.target.value)}
      />
      <div className={`password-strength password-strength--${passwordStrength.strength}`} aria-live="polite">
        <div className="password-strength__header">
          <span>Password strength</span>
          <strong>{passwordStrength.strength.replace('-', ' ')}</strong>
        </div>
        <div className="password-strength__bar">
          <div className="password-strength__fill" style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
        </div>
        <ul className="password-strength__checks">
          {passwordStrength.checks.map(check => (
            <li key={check.label} className={check.ok ? 'is-ok' : 'is-missing'}>{check.label}</li>
          ))}
        </ul>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </AuthForm>
  );
}

function ProfileEditor({ user, onSaved, onCancel }) {
  const { refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // upload avatar file if provided
      if (avatarFile) {
        await api.uploadAvatar(avatarFile);
      }
      await api.updateProfile({ name, bio });
      await refresh();
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Edit Profile</h2>
        {onCancel && <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>}
      </div>
      <label>
        <span style={{ display: 'block', marginBottom: 8, color: '#d5dae2' }}>Name</span>
        <input value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label>
        <span style={{ display: 'block', marginBottom: 8, color: '#d5dae2' }}>Bio</span>
        <textarea value={bio} onChange={e => setBio(e.target.value)} />
      </label>
      <label>
        <span style={{ display: 'block', marginBottom: 8, color: '#d5dae2' }}>Avatar</span>
        <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] ?? null)} />
      </label>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="primary-button" type="submit" disabled={saving}>Save Changes</button>
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </form>
  );
}

function ProfileView({ user, onEdit }) {
  return (
    <div className="profile-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: '0 0 16px 0' }}>{user?.name}</h2>
          {user?.avatarUrl ? <img src={getAvatarUrl(user.avatarUrl)} alt="avatar" style={{ width: 80, height: 80, borderRadius: 12, marginBottom: 16 }} /> : <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(255, 138, 31, 0.2)', marginBottom: 16 }} />}
          <p style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>{user?.email}</p>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{user?.role}</p>
        </div>
        <button className="primary-button" onClick={onEdit}>Edit Profile</button>
      </div>
      {user?.bio && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{user.bio}</p>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="loading-state">Loading session…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function DashboardPage() {
  const { user, accessToken } = useAuth();
  const claims = useMemo(() => (accessToken ? decodeJwtPayload(accessToken) : null), [accessToken]);

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} claims={claims} />;
  }

  return <UserDashboard user={user} claims={claims} />;
}

/**
 * Inner todo dashboard content (uses TodoContext)
 */
function TodoDashboardContent({ user }) {
  const { toast, deleteTodo, clearCompleted, showToast } = useTodo();
  const [editingTodo, setEditingTodo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [clearCompletedConfirm, setClearCompletedConfirm] = useState(false);

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
  };

  const handleDeleteTodo = (todo) => {
    setDeleteConfirm(todo);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteTodo(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
      setClearCompletedConfirm(false);
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  return (
    <div>
      <TodoForm />

      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Filters & Search
        </h3>
        <TodoFilters />
      </div>

      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Statistics
        </h3>
        <TodoStats />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <TodoList onEditTodo={handleEditTodo} onDeleteTodo={handleDeleteTodo} />
      </div>

      <button
        onClick={() => setClearCompletedConfirm(true)}
        className="secondary-button"
        style={{ marginTop: '16px' }}
      >
        Clear Completed Todos
      </button>

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
          onConfirm={handleClearCompleted}
          onCancel={() => setClearCompletedConfirm(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function OverviewStats() {
  const [stats, setStats] = useState({ total: 0, remaining: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await api.getTodoStats();
        setStats(response || { total: 0, remaining: 0, completed: 0 });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>Loading stats...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginTop: '20px' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>{stats.total}</div>
        <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Todos</div>
      </div>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>{stats.remaining}</div>
        <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</div>
      </div>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>{stats.completed}</div>
        <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
      </div>
    </div>
  );
}

function UserDashboard({ user, claims }) {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') || 'overview';
  const [editingProfile, setEditingProfile] = useState(false);

  return (
    <Shell>
      <section className="dashboard-grid">
        {tab === 'overview' && (
          <article className="feature-card accent">
            <span className="eyebrow">Workspace</span>
            <h2>Welcome back</h2>
            <p>Use the tabs to access your todos and profile.</p>
          </article>
        )}
        <article className="feature-card">
          {tab === 'overview' && (
            <>
              <span className="eyebrow">Overview</span>
              <h2>Quick stats</h2>
              <p>Get organized with your personal todo list. Create, edit, and track your tasks with priority levels and due dates.</p>
              <OverviewStats />
            </>
          )}

          {tab === 'todos' && (
            <>
              <span className="eyebrow">Productivity</span>
              <h2>My Todo List</h2>
              <TodoProvider>
                <TodoDashboardContent user={user} />
              </TodoProvider>
            </>
          )}

          {tab === 'profile' && (
            <>
              <span className="eyebrow">Profile</span>
              {editingProfile ? (
                <ProfileEditor user={user} onSaved={() => setEditingProfile(false)} onCancel={() => setEditingProfile(false)} />
              ) : (
                <ProfileView user={user} onEdit={() => setEditingProfile(true)} />
              )}
            </>
          )}
        </article>
      </section>
    </Shell>
  );
}

function AdminDashboard({ user, claims }) {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') || 'overview';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadUsers() {
    setLoading(true);
    try {
      const { users: adminUsers } = await api.adminUsers();
      setUsers(adminUsers);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDeleteUser(userId) {
    try {
      await api.deleteUser(userId);
      setUsers(previous => previous.filter(entry => entry.id !== userId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <Shell>
      <section className="dashboard-grid">
        {tab === 'overview' && (
          <article className="feature-card accent">
            <span className="eyebrow">Admin workspace</span>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <p>Token role claim: {claims?.role}</p>
          </article>
        )}
        <article className="feature-card">
          <span className="eyebrow">Management</span>
          <h2>User Accounts</h2>
          <p>Review and remove accounts directly from the admin dashboard.</p>
          {error ? <p className="form-error">{error}</p> : null}
          {loading ? <p>Loading users...</p> : null}
          {!loading ? (
            <ul className="user-list">
              {users.map(entry => (
                <li className="user-item" key={entry.id}>
                  <div>
                    <strong>{entry.name}</strong>
                    <p>{entry.email} • {entry.role}</p>
                  </div>
                  <button
                    className="link-button"
                    type="button"
                    onClick={() => handleDeleteUser(entry.id)}
                    disabled={entry.id === user.id}
                  >
                    {entry.id === user.id ? 'Current Admin' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </Shell>
  );
}

function AdminPage() {
  const [status, setStatus] = useState('checking');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.adminHealth()
      .then(() => setStatus('authorized'))
      .catch(() => setStatus('denied'));

    api.adminUsers()
      .then(({ users: adminUsers }) => setUsers(adminUsers))
      .catch(() => setUsers([]));
  }, []);

  return (
    <Shell>
      <section className="feature-card accent">
        <span className="eyebrow">Admin console</span>
        <h2>Role-gated management</h2>
        <p>Status: {status}</p>
        <p>Total users: {users.length}</p>
      </section>
    </Shell>
  );
}

function OAuthCallbackPage() {
  const { refresh } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = new URLSearchParams(location.search).get('accessToken');
    if (!accessToken) {
      navigate('/login', { replace: true });
      return;
    }

    syncAccessToken(accessToken);
    refresh()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=oauth_session_failed', { replace: true }));
  }, [location.search, navigate, refresh]);

  return <div className="loading-state">Finalizing Google sign-in…</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPage /></ProtectedRoute>} />
      <Route path="/login" element={<LandingPage initial="login" />} />
      <Route path="/register" element={<LandingPage initial="register" />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
