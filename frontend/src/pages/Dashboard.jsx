import { useState } from 'react';

export default function Dashboard({ user }) {
  const [saves, setSaves] = useState(null);
  const [form, setForm] = useState({ heroName: '', heroLevel: 1, heroScore: 0, heroClass: 'Werebear', saveData: '{}' });
  const [msg, setMsg] = useState('');

  const loadSaves = async () => {
    const res = await fetch('/api/saves', { credentials: 'include' });
    if (res.ok) setSaves(await res.json());
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/saves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        heroName: form.heroName,
        heroLevel: Number(form.heroLevel),
        heroScore: Number(form.heroScore),
        heroClass: form.heroClass,
        saveData: form.saveData,
      }),
    });
    if (res.ok) {
      setMsg('Save uploaded.');
      setForm({ heroName: '', heroLevel: 1, heroScore: 0, heroClass: 'Werebear', saveData: '{}' });
      loadSaves();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error || 'Upload failed');
    }
  };

  return (
    <div className="card">
      <h1>Welcome, {user.username}</h1>
      <p className="muted">Your hero progression lives here.</p>

      <button onClick={loadSaves}>Load my saves</button>

      {saves && saves.length > 0 && (
        <ul className="save-list">
          {saves.map((s) => (
            <li key={s.id}>
              <strong>{s.heroName}</strong> &mdash; Lv {s.heroLevel} {s.heroClass} &mdash; {s.heroScore} pts
            </li>
          ))}
        </ul>
      )}

      <hr />
      <form onSubmit={onSubmit} className="save-form">
        <h2>Upload a save</h2>
        {msg && <p className="muted">{msg}</p>}
        <label>Hero name <input value={form.heroName} onChange={(e) => setForm({ ...form, heroName: e.target.value })} required /></label>
        <label>Level <input type="number" min="1" value={form.heroLevel} onChange={(e) => setForm({ ...form, heroLevel: e.target.value })} /></label>
        <label>Score <input type="number" min="0" value={form.heroScore} onChange={(e) => setForm({ ...form, heroScore: e.target.value })} /></label>
        <label>Class
          <select value={form.heroClass} onChange={(e) => setForm({ ...form, heroClass: e.target.value })}>
            <option>Werebear</option>
            <option>Rune Mage</option>
            <option>Spirit Caller</option>
            <option>Witch Hunter</option>
          </select>
        </label>
        <label>Save data (JSON) <textarea value={form.saveData} onChange={(e) => setForm({ ...form, saveData: e.target.value })} rows="3" /></label>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
