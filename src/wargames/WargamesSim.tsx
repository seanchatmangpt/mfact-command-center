// @ts-nocheck
import React, { useState } from 'react';
import './MosaicLocal';
import AutonomicPlatform from './AutonomicPlatform.jsx';
import { TenFourApp } from './TenFourApp.jsx';

export default function WargamesSim() {
  const [activeView, setActiveView] = useState('autonomic');

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 100px)', border: '1px solid var(--border-active)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Heavy sandboxing wrapper visually separating the environment */}
      <div style={{ padding: '4px 8px', background: 'var(--border-active)', color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', zIndex: 1000, display: 'flex', justifyContent: 'space-between', flex: '0 0 auto' }}>
        <span>[SANDBOXED ENVIRONMENT: WARGAMES.SIM]</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveView('autonomic')} style={{ background: 'none', border: '1px solid var(--border-dim)', color: activeView === 'autonomic' ? '#ffffff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '0 4px' }}>AUTONOMIC_PLATFORM</button>
          <button onClick={() => setActiveView('tenfour')} style={{ background: 'none', border: '1px solid var(--border-dim)', color: activeView === 'tenfour' ? '#ffffff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '0 4px' }}>TEN_FOUR_APP</button>
        </div>
        <span>STRICT TELEMETRY ONLY</span>
      </div>
      <div style={{ flex: 1, background: '#ffffff', color: '#000000', position: 'relative', overflow: 'hidden' }}>
        {activeView === 'autonomic' && <AutonomicPlatform />}
        {activeView === 'tenfour' && <div style={{ height: '100%', overflow: 'auto' }}><TenFourApp /></div>}
      </div>
    </div>
  );
}
