import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MaintenanceSummaryCards from './MaintenanceSummaryCards';
import MaintenanceFilterBar from './MaintenanceFilterBar';
import MaintenanceKanbanBoard from './MaintenanceKanbanBoard';
import MaintenanceTaskDetailModal from './MaintenanceTaskDetailModal';

const MOCK_TASKS = [
  { id: 'MNT-101', equipmentName: 'MRI Scanner 3T', maintenanceType: 'Preventive', scheduledDate: '2023-12-15', assignedTechnician: 'John Doe', status: 'Scheduled', slaState: 'Upcoming' },
  { id: 'MNT-102', equipmentName: 'Ventilator Pro', maintenanceType: 'Calibration', scheduledDate: '2023-12-18', assignedTechnician: 'Sarah Smith', status: 'In Progress', slaState: 'Warning' },
  { id: 'MNT-103', equipmentName: 'ECG Monitor', maintenanceType: 'Corrective', scheduledDate: '2023-12-20', assignedTechnician: 'Unassigned', status: 'Needs Part', slaState: 'Breached' },
];

describe('MaintenanceSummaryCards Component', () => {
  it('renders correct counts in metric cards', () => {
    render(<MaintenanceSummaryCards tasks={MOCK_TASKS} />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // total = 3
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});

describe('MaintenanceFilterBar Component', () => {
  it('triggers search and filter change handlers', () => {
    const handleSearch = vi.fn();
    const handleStatus = vi.fn();

    render(
      <MaintenanceFilterBar
        searchQuery=""
        onSearchChange={handleSearch}
        selectedStatus="ALL"
        onStatusChange={handleStatus}
        selectedTechnician="ALL"
        onTechnicianChange={() => {}}
        selectedSla="ALL"
        onSlaChange={() => {}}
        techniciansList={['John Doe', 'Sarah Smith']}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by equipment name/i);
    fireEvent.change(searchInput, { target: { value: 'MRI' } });
    expect(handleSearch).toHaveBeenCalledWith('MRI');

    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });
    expect(handleStatus).toHaveBeenCalledWith('In Progress');
  });
});

describe('MaintenanceKanbanBoard Component', () => {
  it('renders columns and task cards correctly', () => {
    render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} />);

    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Needs Part')).toBeInTheDocument();
    expect(screen.getByText('MRI Scanner 3T')).toBeInTheDocument();
    expect(screen.getByText('Ventilator Pro')).toBeInTheDocument();
  });

  it('triggers task click handler when card is clicked', () => {
    const handleClick = vi.fn();
    render(<MaintenanceKanbanBoard tasks={MOCK_TASKS} onTaskClick={handleClick} />);

    fireEvent.click(screen.getByText('MRI Scanner 3T'));
    expect(handleClick).toHaveBeenCalledWith(MOCK_TASKS[0]);
  });
});

describe('MaintenanceTaskDetailModal Component', () => {
  it('renders modal details and handles status save', () => {
    const handleUpdateStatus = vi.fn();
    const handleClose = vi.fn();

    render(
      <MaintenanceTaskDetailModal
        task={MOCK_TASKS[0]}
        onClose={handleClose}
        onUpdateStatus={handleUpdateStatus}
      />
    );

    expect(screen.getByText('MRI Scanner 3T')).toBeInTheDocument();
    expect(screen.getByText('MNT-101')).toBeInTheDocument();

    const inProgressBtn = screen.getByRole('button', { name: 'In Progress' });
    fireEvent.click(inProgressBtn);

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    expect(handleUpdateStatus).toHaveBeenCalledWith('MNT-101', 'In Progress');
    expect(handleClose).toHaveBeenCalled();
  });
});
