import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DualRangeSlider from './DualRangeSlider';
import PriceFilterPresetGroup from './PriceFilterPresetGroup';
import DualRangeSliderStudio from './DualRangeSliderStudio';

describe('DualRangeSlider Component', () => {
  it('renders dual thumbs with default initial values', () => {
    render(<DualRangeSlider min={0} max={100} defaultValue={[20, 80]} />);
    
    const minInput = screen.getByLabelText('Minimum value');
    const maxInput = screen.getByLabelText('Maximum value');

    expect(minInput).toBeInTheDocument();
    expect(maxInput).toBeInTheDocument();
    expect(minInput.value).toBe('20');
    expect(maxInput.value).toBe('80');
  });

  it('displays formatted values in tooltips and text display', () => {
    const customFormat = (val) => `$${val}.00`;
    render(
      <DualRangeSlider
        min={0}
        max={100}
        value={[25, 75]}
        formatValue={customFormat}
        showTooltips={true}
      />
    );

    expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$75.00').length).toBeGreaterThan(0);
  });

  it('fires onChange callback when minimum value changes', () => {
    const handleChange = vi.fn();
    render(
      <DualRangeSlider
        min={0}
        max={100}
        value={[10, 90]}
        onChange={handleChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum value');
    fireEvent.change(minInput, { target: { value: '30' } });

    expect(handleChange).toHaveBeenCalledWith([30, 90]);
  });

  it('enforces collision safety and minStepsBetweenThumbs spacing', () => {
    const handleChange = vi.fn();
    render(
      <DualRangeSlider
        min={0}
        max={100}
        step={5}
        minStepsBetweenThumbs={2} // distance must be at least 10
        value={[30, 50]}
        onChange={handleChange}
      />
    );

    const minInput = screen.getByLabelText('Minimum value');
    // Try to move min input to 45 (which violates min distance of 10 from max 50)
    fireEvent.change(minInput, { target: { value: '45' } });

    // min should be clamped to max - minDistance = 50 - 10 = 40
    expect(handleChange).toHaveBeenCalledWith([40, 50]);
  });

  it('handles disabled state correctly', () => {
    render(<DualRangeSlider min={0} max={100} value={[10, 50]} disabled />);

    const minInput = screen.getByLabelText('Minimum value');
    const maxInput = screen.getByLabelText('Maximum value');

    expect(minInput).toBeDisabled();
    expect(maxInput).toBeDisabled();
  });
});

describe('PriceFilterPresetGroup Component', () => {
  it('renders all preset buttons', () => {
    render(<PriceFilterPresetGroup currentValue={[0, 100]} />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Under $25')).toBeInTheDocument();
    expect(screen.getByText('$25 – $50')).toBeInTheDocument();
    expect(screen.getByText('$50+')).toBeInTheDocument();
    expect(screen.getByText('All Prices')).toBeInTheDocument();
  });

  it('calls onSelectPreset with correct range on button click', () => {
    const handlePreset = vi.fn();
    render(
      <PriceFilterPresetGroup
        currentValue={[0, 100]}
        onSelectPreset={handlePreset}
        maxBound={200}
      />
    );

    fireEvent.click(screen.getByText('Under $25'));
    expect(handlePreset).toHaveBeenCalledWith(0, 25);

    fireEvent.click(screen.getByText('$50+'));
    expect(handlePreset).toHaveBeenCalledWith(50, 200);
  });
});

describe('DualRangeSliderStudio Component', () => {
  it('renders interactive studio with telemetry panel and controls', () => {
    render(<DualRangeSliderStudio />);

    expect(screen.getByText('Dual Range Slider Studio')).toBeInTheDocument();
    expect(screen.getByText('Component Preview')).toBeInTheDocument();
    expect(screen.getByText('Live State Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Studio Controls')).toBeInTheDocument();
  });

  it('updates format mode and telemetry output', () => {
    render(<DualRangeSliderStudio />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'percent' } });

    expect(screen.getByText('Value Formatter')).toBeInTheDocument();
  });
});
