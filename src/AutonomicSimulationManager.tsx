import { useState, useEffect, useRef } from 'react';

interface TelemetryEvent {
  id: number;
  timestamp: string;
  domain: string;
  metric: string;
  value: string;
  status: 'ok' | 'critical' | 'warning';
  hash: string;
}

export function AutonomicSimulationManager() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const eventId = useRef(0);

  // Deterministic PRNG to satisfy Core Team Discipline
  const lcg = useRef({
    seed: 12345,
    next() {
      this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
      return this.seed / 4294967296;
    }
  });

  useEffect(() => {
    const domains = ['FLOW', 'DEVOPS', 'LPM', 'REVOPS'];
    const metrics = ['SWARM_OPT', 'FUNDING_REG', 'LATENCY_CHK', 'KOLMOGOROV'];
    const statuses: ('ok' | 'critical' | 'warning')[] = ['ok', 'ok', 'warning', 'critical'];

    const interval = setInterval(() => {
      const id = ++eventId.current;
      const domain = domains[Math.floor(lcg.current.next() * domains.length)];
      const metric = metrics[Math.floor(lcg.current.next() * metrics.length)];
      const status = statuses[Math.floor(lcg.current.next() * statuses.length)];
      const value = (lcg.current.next() * 10).toFixed(4);
      const hash = Math.floor(lcg.current.next() * 0xffffff).toString(16).padStart(6, '0');
      
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;

      setEvents(prev => {
        const newEvents = [{ id, timestamp, domain, metric, value, status, hash }, ...prev];
        return newEvents.slice(0, 6); // Keep last 6 for density
      });
    }, 400); // High frequency

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: '0.5rem', overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>DOMAIN</th>
            <th>METRIC</th>
            <th>VAL</th>
            <th>HASH</th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id} className={`row-${ev.status}`}>
              <td>{ev.timestamp}</td>
              <td>[{ev.domain}]</td>
              <td>{ev.metric}</td>
              <td>{ev.value}</td>
              <td style={{ opacity: 0.5 }}>0x{ev.hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
