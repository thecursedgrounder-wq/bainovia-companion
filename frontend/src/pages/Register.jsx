import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
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
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <div className="card auth-card">
      <h1>Create account</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSubmit}>
        <label>Username
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        </label>
        <label>Password (8+ chars, letter + number)
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
        </label>
        <button type="submit">Register</button>
      </form>
      <p className="muted">Have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
