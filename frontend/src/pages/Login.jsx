import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const user = await res.json();
      onLogin(user);
      navigate('/dashboard');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="card auth-card">
      <h1>Log in</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSubmit}>
        <label>Username
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </label>
        <button type="submit">Log in</button>
      </form>
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
