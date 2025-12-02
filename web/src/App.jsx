import React from 'react';
import AvatarFullRealtime from './AvatarFullRealtime.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';

export default function App(){
  return (
    <div style={{ padding: 20 }}>
      <h2>Imagym — Avatar Realtime</h2>
      <AvatarFullRealtime wsUrl={location.origin.replace(/^http/, 'ws').replace(/:\d+/, ':3001')} avatarUrlProp="/avatar.jpg" />
      <hr style={{ margin: '20px 0' }} />
      <AdminDashboard apiBase={location.origin.replace(/^http/, 'https')} />
    </div>

  );
}
