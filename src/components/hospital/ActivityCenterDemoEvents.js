/**
 * ActivityCenterDemoEvents.js - Demo event repository and offline fallback helper.
 */

export const DEMO_EVENTS = [
  {
    id: 'evt-001',
    category: 'SLA',
    severity: 'CRITICAL',
    title: 'SLA Breach Warning: Ventilator Pro #EQ-4091',
    detail: 'Preventive maintenance is overdue by 48 hours. Equipment is currently marked as High Priority.',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actor: 'System Automation Rule #14',
    read: false,
  },
  {
    id: 'evt-002',
    category: 'MAINTENANCE',
    severity: 'WARNING',
    title: 'Technician Reassigned: MRI Scanner 3T',
    detail: 'Task MNT-009 reassigned to Senior Engineer Sarah Smith.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    actor: 'Hospital Admin',
    read: false,
  },
  {
    id: 'evt-003',
    category: 'EQUIPMENT',
    severity: 'INFO',
    title: 'New Equipment Registered',
    detail: 'Ultrasound Portable Unit #EQ-8812 successfully onboarded to ICU Ward 4.',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actor: 'Dr. Robert Chen',
    read: true,
  },
  {
    id: 'evt-004',
    category: 'PROCUREMENT',
    severity: 'INFO',
    title: 'RFQ Quote Submitted',
    detail: 'Supplier MedTech Supplies Co. submitted a quotation of $12,450 for Infusion Pump order.',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    actor: 'Supplier Desk',
    read: true,
  },
  {
    id: 'evt-005',
    category: 'SHIPMENT',
    severity: 'WARNING',
    title: 'Shipment Delayed: Oxygen Concentrators',
    detail: 'Shipment #SHP-9011 delayed in transit due to logistics carrier hold.',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    actor: 'Carrier Logistics',
    read: false,
  },
  {
    id: 'evt-006',
    category: 'APPROVAL',
    severity: 'INFO',
    title: 'Purchase Requisition Approved',
    detail: 'Requisition #PR-302 for 10x Defibrillator replacement batteries approved by Finance.',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    actor: 'Finance Director',
    read: true,
  },
];

export const getLocalDemoEvents = () => {
  try {
    const saved = localStorage.getItem('medtrack_activity_events');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local demo events', e);
  }
  localStorage.setItem('medtrack_activity_events', JSON.stringify(DEMO_EVENTS));
  return DEMO_EVENTS;
};

export const saveLocalDemoEvents = (events) => {
  try {
    localStorage.setItem('medtrack_activity_events', JSON.stringify(events));
  } catch (e) {
    console.warn('Failed to save local demo events', e);
  }
};
