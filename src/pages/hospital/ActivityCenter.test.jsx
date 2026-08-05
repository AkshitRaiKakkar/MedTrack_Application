import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivityCenter from './ActivityCenter';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, token: null } }),
}));

vi.mock('../../services/EventStreamService', () => ({
  eventStream: {
    onEvent: vi.fn(() => () => {}),
    onConnectionChange: vi.fn(() => () => {}),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
  getEvents: vi.fn(() => Promise.resolve({ content: [], last: true })),
  getUnreadCounts: vi.fn(() => Promise.resolve({ total: 0, byCategory: {} })),
  markEventsAsRead: vi.fn(() => Promise.resolve()),
  markAllEventsAsRead: vi.fn(() => Promise.resolve()),
}));

const mockGetPreferences = vi.fn();
const mockSetPreference = vi.fn(() => Promise.resolve());
vi.mock('../../services/NotificationPreferenceService', () => ({
  getNotificationPreferences: (...args) => mockGetPreferences(...args),
  setNotificationPreference: (...args) => mockSetPreference(...args),
}));

describe('ActivityCenter notification preferences', () => {
  beforeEach(() => {
    mockGetPreferences.mockReset().mockResolvedValue({
      muted: { MAINTENANCE: false, EQUIPMENT: false, PROCUREMENT: false, SHIPMENT: false, APPROVAL: false, SLA: false },
    });
    mockSetPreference.mockClear();
  });

  it('loads mute state and dims a muted category chip', async () => {
    mockGetPreferences.mockResolvedValue({
      muted: { MAINTENANCE: false, EQUIPMENT: true, PROCUREMENT: false, SHIPMENT: false, APPROVAL: false, SLA: false },
    });

    render(<ActivityCenter onClose={() => {}} onNavigate={() => {}} />);

    const equipmentChip = await screen.findByText('Equipment');
    expect(equipmentChip.closest('span')).toHaveClass('opacity-50');
  });

  it('toggles mute for a category and persists it via the service', async () => {
    render(<ActivityCenter onClose={() => {}} onNavigate={() => {}} />);

    await waitFor(() => expect(mockGetPreferences).toHaveBeenCalled());

    const muteButton = await screen.findByRole('button', { name: 'Mute Equipment' });
    fireEvent.click(muteButton);

    await waitFor(() => expect(mockSetPreference).toHaveBeenCalledWith('EQUIPMENT', true));
  });
});
