import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

jest.mock('../components/RealTimeMetrics', () => ({
  RealTimeMetrics: () => <div data-testid="metrics">Métricas en Tiempo Real</div>
}));
jest.mock('../components/RealTimeAlerts', () => ({
  RealTimeAlerts: () => <div data-testid="alerts">Alertas en Tiempo Real</div>
}));

describe('Dashboard', () => {
  it('debe renderizar los componentes de métricas y alertas', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('metrics')).toBeInTheDocument();
    expect(screen.getByTestId('alerts')).toBeInTheDocument();
  });
}); 