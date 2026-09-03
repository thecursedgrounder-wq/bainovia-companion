import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setRows)
      .catch(() => setError('Could not load leaderboard'));
  }, []);

  return (
    <div className="card">
      <h1>Leaderboard</h1>
      {error && <p className="error">{error}</p>}
      <table className="lb">
        <thead>
          <tr><th>#</th><th>Hero</th><th>Player</th><th>Class</th><th>Level</th><th>Score</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r.heroName}</td>
              <td>{r.username}</td>
              <td>{r.heroClass}</td>
              <td>{r.heroLevel}</td>
              <td>{r.heroScore}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan="6" className="muted">No heroes yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
