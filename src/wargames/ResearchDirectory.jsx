import React, { Suspense, useState, useMemo } from 'react';
import { Panel } from './AutonomicPlatform';

const paperModules = import.meta.glob('../papers/*.jsx');

export function ResearchDirectory() {
  const [activePaper, setActivePaper] = useState(null);

  const papers = useMemo(() => {
    return Object.keys(paperModules).map((path) => {
      const name = path.replace('../papers/', '').replace('.jsx', '');
      return { path, name, Component: React.lazy(paperModules[path]) };
    });
  }, []);

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%', overflow: 'hidden' }}>
      <Panel title="Multifractal Export Directory" tag="GGEN" style={{ width: '320px', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontFamily: 'sans-serif' }}>
            Found {papers.length} dynamically generated JSX papers.
          </div>
          {papers.map((p) => (
            <button
              key={p.name}
              onClick={() => setActivePaper(p)}
              style={{
                padding: '8px 12px',
                background: activePaper?.name === p.name ? 'rgba(52, 230, 168, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activePaper?.name === p.name ? '#34e6a8' : 'rgba(255,255,255,0.1)'}`,
                color: activePaper?.name === p.name ? '#34e6a8' : '#f1f5f9',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </Panel>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activePaper ? (
          <Suspense fallback={<div style={{ padding: '24px', color: '#33e1ff' }}>Loading JSX component for {activePaper.name}...</div>}>
            <activePaper.Component />
          </Suspense>
        ) : (
          <div style={{ padding: '24px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {"<"} Select a paper from the directory to view its dynamically generated JSX.
          </div>
        )}
      </div>
    </div>
  );
}
