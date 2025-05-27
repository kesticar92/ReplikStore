import React from 'react';
import { RealTimeMetrics } from '../components/RealTimeMetrics';
import { RealTimeAlerts } from '../components/RealTimeAlerts';

export default function Dashboard() {
  return (
    <div style={{maxWidth: 800, margin: '0 auto', padding: 32}}>
      <h1>Panel de Monitoreo en Tiempo Real</h1>
      <RealTimeMetrics />
      <RealTimeAlerts />
    </div>
  );
} 