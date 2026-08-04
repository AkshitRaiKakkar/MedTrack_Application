import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MaintenanceRuleSimulator from './MaintenanceRuleSimulator';
import { DEFAULT_DEMO_RULES, getLocalRules, saveLocalRules } from './PreventiveMaintenanceDemoRules';

const MOCK_RULE = DEFAULT_DEMO_RULES[0];

describe('PreventiveMaintenanceDemoRules Utility', () => {
  it('returns default rules and supports local updates', () => {
    const rules = getLocalRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].name).toBeDefined();

    saveLocalRules([MOCK_RULE]);
    const updated = getLocalRules();
    expect(updated.length).toBe(1);
    expect(updated[0].name).toBe(MOCK_RULE.name);
  });
});

describe('MaintenanceRuleSimulator Component', () => {
  it('renders simulator forecast correctly', () => {
    render(<MaintenanceRuleSimulator rule={MOCK_RULE} onClose={() => {}} />);

    expect(screen.getByText('Rule Recurrence Simulator')).toBeInTheDocument();
    expect(screen.getByText(MOCK_RULE.name)).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
  });

  it('handles horizon toggle and triggers task generation callback', () => {
    const handleGenerate = vi.fn();
    const handleClose = vi.fn();

    render(
      <MaintenanceRuleSimulator
        rule={MOCK_RULE}
        onClose={handleClose}
        onGenerateTasks={handleGenerate}
      />
    );

    const btn12 = screen.getByRole('button', { name: '12 Months' });
    fireEvent.click(btn12);

    const executeBtn = screen.getByRole('button', { name: /Execute Task Generation/i });
    fireEvent.click(executeBtn);

    expect(handleGenerate).toHaveBeenCalledWith(MOCK_RULE);
    expect(handleClose).toHaveBeenCalled();
  });
});
