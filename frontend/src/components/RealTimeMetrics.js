import React, { useState, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

export function RealTimeMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [sensorFilter, setSensorFilter] = useState('all');

  const handleMessage = (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'metrics') {
        setMetrics((prev) => [parsed.payload, ...prev].slice(0, 50));
      }
    } catch (e) {}
  };

  const { connected, error } = useWebSocket(WS_URL, handleMessage);

  // Obtener lista única de sensores
  const sensorTypes = useMemo(() => {
    const types = metrics.map(m => m.sensorName || m.sensor || 'Sensor');
    return ['all', ...Array.from(new Set(types))];
  }, [metrics]);

  // Filtrar métricas según selección
  const filteredMetrics = useMemo(() => {
    if (sensorFilter === 'all') return metrics;
    return metrics.filter(m => (m.sensorName || m.sensor) === sensorFilter);
  }, [metrics, sensorFilter]);

  return (
    <div style={{border: '1px solid #1976d2', padding: 16, borderRadius: 8, marginBottom: 24, background: '#f0f7ff'}}>
      <h2 style={{color: '#1976d2'}}>Métricas en Tiempo Real</h2>
      <div>Estado WebSocket: {connected ? 'Conectado' : 'Desconectado'}</div>
      {error && <div style={{color: 'red'}}>Error: {error.message}</div>}
      <div style={{margin: '12px 0'}}>
        <label>Filtrar por sensor: </label>
        <select value={sensorFilter} onChange={e => setSensorFilter(e.target.value)}>
          {sensorTypes.map(type => (
            <option key={type} value={type}>{type === 'all' ? 'Todos' : type}</option>
          ))}
        </select>
      </div>
      <ul>
        {filteredMetrics.map((m, i) => (
          <li key={i} style={{marginBottom: 8, background: '#fff', borderRadius: 4, padding: 8}}>
            <strong>{m.sensorName || m.sensor || 'Sensor'}:</strong> {m.value} {m.unit}
            <span style={{marginLeft: 8, color: '#888'}}>{m.timestamp ? formatDate(m.timestamp) : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 