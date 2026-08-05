import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityCenterEventDetailModal from './ActivityCenterEventDetailModal';
import { getLocalDemoEvents, saveLocalDemoEvents } from './ActivityCenterDemoEvents';

const MOCK_EVENT = {
  id: 'evt-test-1',
  category: 'SLA',
  severity: 'CRITICAL',
  title: 'Test SLA Breach Event',
  detail: 'Detailed test information regarding SLA.',
  createdAt: new Date().toISOString(),
  actor: 'Admin User',
  read: false,
};

describe('ActivityCenterDemoEvents Utility', () => {
  it('returns local demo events and handles storage updates', () => {
    const events = getLocalDemoEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].id).toBeDefined();

    saveLocalDemoEvents([MOCK_EVENT]);
    const updated = getLocalDemoEvents();
    expect(updated.length).toBe(1);
    expect(updated[0].title).toBe('Test SLA Breach Event');
  });
});

describe('ActivityCenterEventDetailModal Component', () => {
  it('renders event modal details correctly', () => {
    render(<ActivityCenterEventDetailModal event={MOCK_EVENT} onClose={() => {}} />);

    expect(screen.getByText('Test SLA Breach Event')).toBeInTheDocument();
    expect(screen.getByText('evt-test-1')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('handles resolve button click and triggers callback', () => {
    const handleMarkAsRead = vi.fn();
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <ActivityCenterEventDetailModal
        event={MOCK_EVENT}
        onClose={handleClose}
        onMarkAsRead={handleMarkAsRead}
        onNavigate={handleNavigate}
      />
    );

    const resolveBtn = screen.getByRole('button', { name: /Resolve & View Console/i });
    fireEvent.click(resolveBtn);

    expect(handleMarkAsRead).toHaveBeenCalledWith(['evt-test-1']);
    expect(handleNavigate).toHaveBeenCalledWith('maintenance');
    expect(handleClose).toHaveBeenCalled();
  });
});
