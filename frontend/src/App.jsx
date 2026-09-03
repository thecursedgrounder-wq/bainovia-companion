import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div className="app-loading">Loading Bainovia Companion&hellip;</div>;

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand">Bainovia Companion</span>
        {user && (
          <nav>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <button className="link-btn" onClick={logout}>Log out</button>
          </nav>
        )}
      </header>
      <main>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
      </main>
    </div>
  );
}
