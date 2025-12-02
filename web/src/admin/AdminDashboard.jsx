import React, { useEffect, useState } from 'react';

export default function AdminDashboard({ apiBase = '' }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase + '/admin/learning/candidates', {
        headers: { 'x-admin-key': localStorage.getItem('ADMIN_API_KEY') || '' }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const approve = async (id) => {
    await fetch(apiBase + '/admin/learning/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('ADMIN_API_KEY') || '' },
      body: JSON.stringify({ id })
    });
    fetchCandidates();
  };

  const reject = async (id) => {
    await fetch(apiBase + '/admin/learning/candidate/' + id, {
      method: 'DELETE',
      headers: { 'x-admin-key': localStorage.getItem('ADMIN_API_KEY') || '' }
    });
    fetchCandidates();
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Admin — Learning Candidates</h3>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div>
        {candidates.length === 0 && <div>No candidates</div>}
        {candidates.map(c => (
          <div key={c.id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#666' }}>{new Date(c.timestamp).toLocaleString()}</div>
            <div style={{ marginTop: 6 }}>{c.text}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => approve(c.id)} style={{ marginRight: 8 }}>Approve</button>
              <button onClick={() => reject(c.id)}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
