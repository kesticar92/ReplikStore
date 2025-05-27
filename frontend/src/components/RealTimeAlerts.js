import React, { useState, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

function getColor(severity) {
  if (severity === 'critical') return '#d32f2f';
  if (severity === 'warning') return '#ffa000';
  return '#1976d2';
}
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

export function RealTimeAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('all');

  const handleMessage = (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'alert') {
        setAlerts((prev) => [parsed.payload, ...prev].slice(0, 50));
      }
    } catch (e) {}
  };

  const { connected, error } = useWebSocket(WS_URL, handleMessage);

  // Obtener lista única de severidades
  const severities = useMemo(() => {
    const types = alerts.map(a => a.severity || 'info');
    return ['all', ...Array.from(new Set(types))];
  }, [alerts]);

  // Filtrar alertas según selección
  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'all') return alerts;
    return alerts.filter(a => (a.severity || 'info') === severityFilter);
  }, [alerts, severityFilter]);

  return (
    <div style={{border: '1px solid #d32f2f', padding: 16, borderRadius: 8, marginBottom: 24, background: '#fff5f5'}}>
      <h2 style={{color: '#d32f2f'}}>Alertas en Tiempo Real</h2>
      <div>Estado WebSocket: {connected ? 'Conectado' : 'Desconectado'}</div>
      {error && <div style={{color: 'red'}}>Error: {error.message}</div>}
      <div style={{margin: '12px 0'}}>
        <label>Filtrar por severidad: </label>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          {severities.map(type => (
            <option key={type} value={type}>{type === 'all' ? 'Todas' : type}</option>
          ))}
        </select>
      </div>
      <ul>
        {filteredAlerts.map((a, i) => (
          <li key={i} style={{marginBottom: 8, borderLeft: `4px solid ${getColor(a.severity)}`, paddingLeft: 8, background: '#fff', borderRadius: 4, padding: 8}}>
            <span style={{
              display: 'inline-block',
              background: getColor(a.severity),
              color: '#fff',
              borderRadius: 4,
              padding: '2px 8px',
              marginRight: 8,
              fontWeight: 'bold'
            }}>{a.severity || 'info'}</span>
            <strong>{a.title || 'Alerta'}</strong>
            <span style={{marginLeft: 8, color: '#888'}}>{a.timestamp ? formatDate(a.timestamp) : ''}</span>
            <div>{a.message || JSON.stringify(a)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 