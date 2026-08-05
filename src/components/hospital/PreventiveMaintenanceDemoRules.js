/**
 * PreventiveMaintenanceDemoRules.js - Demo rules repository and local storage manager.
 */

export const DEFAULT_DEMO_RULES = [
  {
    id: 101,
    name: 'ICU Monitor Quarterly Calibration',
    description: 'Automated 90-day calibration cycle for all patient monitoring systems in ICU.',
    ruleScope: 'EQUIPMENT_CATEGORY',
    equipmentCategory: 'MONITORING',
    priority: 'High',
    frequency: 'QUARTERLY',
    customIntervalDays: null,
    maintenanceType: 'Calibration',
    slaWarningDays: 5,
    slaBreachDays: 2,
    leadTimeDays: 14,
    active: true,
  },
  {
    id: 102,
    name: 'Ventilator Bi-Weekly Filter Inspection',
    description: '14-day inspection and HEPA filter check for respiratory equipment.',
    ruleScope: 'EQUIPMENT_CATEGORY',
    equipmentCategory: 'RESPIRATORY',
    priority: 'Critical',
    frequency: 'CUSTOM',
    customIntervalDays: 14,
    maintenanceType: 'Preventive',
    slaWarningDays: 3,
    slaBreachDays: 1,
    leadTimeDays: 5,
    active: true,
  },
  {
    id: 103,
    name: 'MRI Scanner Monthly Coolant Check',
    description: 'Helium pressure level verification and compressor cooling check.',
    ruleScope: 'EQUIPMENT_CATEGORY',
    equipmentCategory: 'IMAGING',
    priority: 'High',
    frequency: 'MONTHLY',
    customIntervalDays: null,
    maintenanceType: 'Preventive',
    slaWarningDays: 7,
    slaBreachDays: 3,
    leadTimeDays: 10,
    active: true,
  },
  {
    id: 104,
    name: 'GE Healthcare Annual Overhaul',
    description: 'Manufacturer mandated 365-day full system overhaul for GE medical devices.',
    ruleScope: 'MANUFACTURER_INTERVAL',
    manufacturer: 'GE Healthcare',
    priority: 'Normal',
    frequency: 'YEARLY',
    customIntervalDays: null,
    maintenanceType: 'Inspection',
    slaWarningDays: 14,
    slaBreachDays: 5,
    leadTimeDays: 30,
    active: true,
  },
];

export const getLocalRules = () => {
  try {
    const saved = localStorage.getItem('medtrack_maintenance_rules');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load local maintenance rules', e);
  }
  localStorage.setItem('medtrack_maintenance_rules', JSON.stringify(DEFAULT_DEMO_RULES));
  return DEFAULT_DEMO_RULES;
};

export const saveLocalRules = (rules) => {
  try {
    localStorage.setItem('medtrack_maintenance_rules', JSON.stringify(rules));
  } catch (e) {
    console.warn('Failed to save local maintenance rules', e);
  }
};
