// SVG Icons
const LinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0 7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const AlertIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

export function ARTDependencies() {
  return (
    <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {/* Dependency Graph Visualization Placeholder */}
      <div className="bento-card card-span-2">
        <h3 className="card-title">Cross-ART Dependency Graph</h3>
        <div className="topology-visual" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Local network nodes for visuals */}
            <div style={{ position: 'absolute', top: '40px', left: '100px', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', borderRadius: '8px' }}>Frontend ART</div>
            <div style={{ position: 'absolute', top: '120px', left: '400px', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-secondary)', borderRadius: '8px' }}>Backend ART</div>
            <div style={{ position: 'absolute', top: '60px', left: '600px', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-tertiary)', borderRadius: '8px' }}>Data ART</div>
            {/* SVG lines connecting them to mimic graph */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
               <line x1="200" y1="60" x2="400" y2="140" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray="5,5" />
               <line x1="500" y1="140" x2="600" y2="80" stroke="var(--accent-secondary)" strokeWidth="2" />
            </svg>
        </div>
      </div>

      {/* Critical Dependencies List */}
      <div className="bento-card">
        <h3 className="card-title"><AlertIcon /> Critical Blockers</h3>
        <div className="data-stream" style={{ marginTop: '0.5rem' }}>
          <div className="stream-item critical">
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>API-202: GraphQL</strong>
              <span className="text-secondary text-sm">Blocked by Data-Lake provisioning (Data ART)</span>
            </div>
            <span style={{ color: 'var(--accent-secondary)' }}>Iteration 2</span>
          </div>
          <div className="stream-item">
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Feat-102: Analytics</strong>
              <span className="text-secondary text-sm">Awaiting API-202 schema (Backend ART)</span>
            </div>
            <span style={{ color: 'var(--accent-tertiary)' }}>Iteration 2</span>
          </div>
        </div>
      </div>

      {/* Give/Get Matrix */}
      <div className="bento-card">
        <h3 className="card-title"><LinkIcon /> Give / Get Matrix (Top Commitments)</h3>
        <div style={{ marginTop: '1rem' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                <th style={{ paddingBottom: '0.5rem' }}>Requesting Team</th>
                <th style={{ paddingBottom: '0.5rem' }}>Providing Team</th>
                <th style={{ paddingBottom: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 0' }}>Frontend ART</td>
                <td>Backend ART</td>
                <td><span className="status-badge-small">Committed</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 0' }}>Backend ART</td>
                <td>Data ART</td>
                <td><span className="status-badge-small" style={{ background: 'rgba(236,72,153,0.1)', color: 'var(--accent-secondary)', borderColor: 'rgba(236,72,153,0.2)' }}>At Risk</span></td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 0' }}>Marketing</td>
                <td>Frontend ART</td>
                <td><span className="status-badge-small">Committed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
