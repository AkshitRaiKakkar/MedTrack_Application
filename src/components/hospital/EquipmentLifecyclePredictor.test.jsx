import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/utils/renderWithProviders';
import EquipmentLifecyclePredictor from '../../pages/hospital/EquipmentLifecyclePredictor';

describe('EquipmentLifecyclePredictor Component', () => {
  it('renders summary metrics and equipment list', () => {
    renderWithProviders(<EquipmentLifecyclePredictor />);

    expect(screen.getByText('Equipment Lifecycle & Predictive Failure Analytics')).toBeInTheDocument();
    expect(screen.getByText('Monitored Fleet')).toBeInTheDocument();
    expect(screen.getByText('Replacement Due')).toBeInTheDocument();
    expect(screen.getByText('MRI Scanner 3T Signature')).toBeInTheDocument();
  });

  it('filters equipment list by risk tier selector', () => {
    renderWithProviders(<EquipmentLifecyclePredictor />);

    const select = screen.getByDisplayValue('All Risk Tiers');
    fireEvent.change(select, { target: { value: 'CRITICAL' } });

    expect(screen.getByText('CT Scanner Revolution 128-Slice')).toBeInTheDocument();
    expect(screen.queryByText('Patient Monitor IntelliVue MX800')).not.toBeInTheDocument();
  });

  it('opens inspect modal on row click', () => {
    renderWithProviders(<EquipmentLifecyclePredictor />);

    const rowItem = screen.getByText('MRI Scanner 3T Signature');
    fireEvent.click(rowItem);

    expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
    expect(screen.getByText('Plan procurement replacement within 2 quarters. High compressor wear.')).toBeInTheDocument();
  });
});
