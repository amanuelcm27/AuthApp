import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api, apiBaseUrl, setAccessToken as syncAccessToken } from './api.js';
import { useAuth } from './auth.jsx';

function decodeJwtPayload(token) {
  const payload = token.split('.')[1] ?? '';
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
}

function Shell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">A</div>
          <h1>AuthApp</h1>
          <p>Secure access layer</p>
        </div>
        <p className="sidebar-note">Your workspace is selected automatically from your role.</p>
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

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());

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
      <label>Password<input name="password" type="password" placeholder="Admin123!" required /></label>
      {error ? <p className="form-error">{error}</p> : null}
    </AuthForm>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
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
      <label>Password<input name="password" type="password" placeholder="Create a password" required /></label>
      {error ? <p className="form-error">{error}</p> : null}
    </AuthForm>
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

function UserDashboard({ user, claims }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listTodos()
      .then(({ todos: todoList }) => setTodos(todoList))
      .catch(loadError => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateTodo(event) {
    event.preventDefault();
    if (newTodo.trim().length < 2) {
      setError('Todo title must be at least 2 characters');
      return;
    }

    try {
      const { todo } = await api.createTodo({ title: newTodo.trim() });
      setTodos(previous => [todo, ...previous]);
      setNewTodo('');
      setError('');
    } catch (creationError) {
      setError(creationError.message);
    }
  }

  async function handleToggleTodo(todo) {
    try {
      const { todo: updated } = await api.updateTodo(todo.id, { completed: !todo.completed });
      setTodos(previous => previous.map(entry => (entry.id === updated.id ? updated : entry)));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleDeleteTodo(todoId) {
    try {
      await api.deleteTodo(todoId);
      setTodos(previous => previous.filter(entry => entry.id !== todoId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <Shell>
      <section className="dashboard-grid">
        <article className="feature-card accent">
          <span className="eyebrow">User workspace</span>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <p>Token role claim: {claims?.role}</p>
        </article>
        <article className="feature-card">
          <span className="eyebrow">Productivity</span>
          <h2>My Todo List</h2>
          <form className="todo-form" onSubmit={handleCreateTodo}>
            <input
              value={newTodo}
              onChange={event => setNewTodo(event.target.value)}
              placeholder="Add a task for today"
              aria-label="New todo"
            />
            <button className="primary-button" type="submit">Add</button>
          </form>
          {error ? <p className="form-error">{error}</p> : null}
          {loading ? <p>Loading todos...</p> : null}
          {!loading ? (
            <ul className="todo-list">
              {todos.map(todo => (
                <li key={todo.id} className="todo-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo)}
                    />
                    <span className={todo.completed ? 'todo-done' : ''}>{todo.title}</span>
                  </label>
                  <button className="link-button" type="button" onClick={() => handleDeleteTodo(todo.id)}>
                    Delete
                  </button>
                </li>
              ))}
              {todos.length === 0 ? <li className="todo-empty">No todos yet. Add your first task.</li> : null}
            </ul>
          ) : null}
        </article>
      </section>
    </Shell>
  );
}

function AdminDashboard({ user, claims }) {
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
        <article className="feature-card accent">
          <span className="eyebrow">Admin workspace</span>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <p>Token role claim: {claims?.role}</p>
        </article>
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
