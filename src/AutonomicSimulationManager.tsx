import { useState, useEffect, useRef } from 'react';

interface TelemetryEvent {
  id: number;
  timestamp: string;
  domain: string;
  metric: string;
  value: string;
  status: 'ok' | 'critical' | 'warning';
  hash: string;
  isWs?: boolean;
}

export function AutonomicSimulationManager() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [status, setStatus] = useState('Connecting...');
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
    // 1. Simulated local telemetry
    const domains = ['FLOW', 'DEVOPS', 'LPM', 'REVOPS'];
    const metrics = ['SWARM_OPT', 'FUNDING_REG', 'LATENCY_CHK', 'KOLMOGOROV'];
    const statuses: ('ok' | 'critical' | 'warning')[] = ['ok', 'ok', 'warning', 'critical'];

    const interval = setInterval(() => {
      const id = ++eventId.current;
      const domain = domains[Math.floor(lcg.current.next() * domains.length)];
      const metric = metrics[Math.floor(lcg.current.next() * metrics.length)];
      const currentStatus = statuses[Math.floor(lcg.current.next() * statuses.length)];
      const value = (lcg.current.next() * 10).toFixed(4);
      const hash = Math.floor(lcg.current.next() * 0xffffff).toString(16).padStart(6, '0');
      
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;

      setEvents(prev => {
        const newEvents = [{ id, timestamp, domain, metric, value, status: currentStatus, hash }, ...prev];
        return newEvents.slice(0, 8); // Keep last 8
      });
    }, 1000); 

    // 2. Axum WebSocket connection
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3030/ws';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setStatus('Connected');
      socket.send('ACK');
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.source && parsed.event) {
          const now = new Date();
          const timestamp = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
          
          setEvents(prev => {
            const wsEvent: TelemetryEvent = {
              id: ++eventId.current,
              timestamp,
              domain: 'WS_AXUM',
              metric: parsed.event,
              value: `S=${parsed.thermodynamic_state?.S || ''} G=${parsed.thermodynamic_state?.G || ''}`,
              status: 'ok',
              hash: parsed.source,
              isWs: true
            };
            return [wsEvent, ...prev].slice(0, 8);
          });
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    socket.onclose = () => {
      setStatus('Disconnected');
    };

    return () => {
      clearInterval(interval);
      socket.close();
    };
  }, []);

  return (
    <div style={{ marginTop: '0.5rem', overflow: 'hidden' }} className="glass-container">
      <div className="status-badge" data-testid="status">WS: {status}</div>
      <table className="data-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>DOMAIN</th>
            <th>METRIC</th>
            <th>VAL</th>
            <th>HASH/SRC</th>
          </tr>
        </thead>
        <tbody data-testid="data-card">
          {events.map(ev => (
            <tr key={ev.id} className={`row-${ev.status} ${ev.isWs ? 'ws-row' : ''}`}>
              <td>{ev.timestamp}</td>
              <td><span className={ev.isWs ? 'highlight-badge' : ''}>[{ev.domain}]</span></td>
              <td>{ev.metric}</td>
              <td className="val-col">{ev.value}</td>
              <td style={{ opacity: ev.isWs ? 1 : 0.5 }}>{ev.isWs ? ev.hash : `0x${ev.hash}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
