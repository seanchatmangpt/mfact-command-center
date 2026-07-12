export function PIPlanningBoard() {
  return (
    <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {/* Header Row */}
      <div className="bento-card" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-primary)' }}>
        <h3 className="card-title">Team / Iteration</h3>
      </div>
      <div className="bento-card">
        <h3 className="card-title">Iteration 1</h3>
        <p className="text-secondary text-sm">Capacity: 40</p>
      </div>
      <div className="bento-card">
        <h3 className="card-title">Iteration 2</h3>
        <p className="text-secondary text-sm">Capacity: 40</p>
      </div>
      <div className="bento-card">
        <h3 className="card-title">Iteration 3</h3>
        <p className="text-secondary text-sm">Capacity: 40</p>
      </div>
      <div className="bento-card" style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid var(--accent-secondary)' }}>
        <h3 className="card-title">IP Iteration</h3>
        <p className="text-secondary text-sm">Innovation & Planning</p>
      </div>

      {/* Team A Row */}
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center' }}>
        <h3 className="card-title" style={{ margin: 0 }}>Frontend ART</h3>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small" style={{ marginBottom: '0.5rem' }}>Feat-101: Dashboard</div>
        <div className="status-badge-small" style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-secondary)' }}>Defect-42</div>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small">Feat-102: Analytics</div>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small">Feat-103: Export</div>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Hackathon</div>
      </div>

      {/* Team B Row */}
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center' }}>
        <h3 className="card-title" style={{ margin: 0 }}>Backend ART</h3>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small">API-201: Auth</div>
      </div>
      <div className="bento-card" style={{ padding: '1rem', border: '1px dashed var(--accent-primary)' }}>
        <div className="status-badge-small" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)' }}>API-202: GraphQL</div>
        <p className="text-xs text-secondary mt-1" style={{ marginTop: '0.5rem' }}>Deps: Feat-102</p>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small">API-203: Cache</div>
      </div>
      <div className="bento-card" style={{ padding: '1rem' }}>
        <div className="status-badge-small" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>Maintenance</div>
      </div>
    </div>
  );
}
